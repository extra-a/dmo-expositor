export type TimeStamped = {
  timestamp: number;
}

interface Bucket<T extends TimeStamped> {
  start: number,
  data: T[];
}

export class EvSeq<T extends TimeStamped> {
  events: Bucket<T>[]= [];

  constructor(private granularity = 1000) {
    this.events.push({ start: 0, data: [] });
  }

  add(item: T) {
    const ts = item.timestamp;
    this.fillMissing(ts);
    const bucket = this.getBucket(ts)!;
    bucket.data.push(item);
  }

  getInterval(ts: number): [T, T] | void {
    if (ts < 0) {
      return;
    }
    const [prevBucket, bucket, nextBucket] = this.getBuckets(ts);
    if (!bucket) {
      return;
    }
    const curLen = bucket.data.length;
    const endIntervalIdx = this.findEnd(bucket.data, ts);

    if (endIntervalIdx < 0) {
      return;
    }
    if (endIntervalIdx === 0) {
      const prevLen = prevBucket?.data.length ?? 0;
      if (prevLen === 0) {
        return;
      }
      return [prevBucket.data[prevLen-1], bucket.data[0]];
    } else if (endIntervalIdx === curLen) {
      const nextLen = nextBucket?.data.length ?? 0;
      if (nextLen === 0) {
        return;
      }
      return [bucket.data[curLen-1], nextBucket.data[0]];
    } else {
      return [bucket.data[endIntervalIdx-1], bucket.data[endIntervalIdx]];
    }
  }

  *[Symbol.iterator]() {
    for (const bucket of this.events) {
      for (const item of bucket.data) {
        yield item;
      }
    }
  }

  private findEnd(data: T[], ts: number) {
    if (data.length === 0) {
      return -1;
    }
    let idx = 0;
    while (idx < data.length && data[idx].timestamp < ts) {
      idx++;
    }
    return idx;
  }

  private getBucket(ts: number) {
    const idx = Math.trunc(ts/this.granularity);
    return this.events[idx];
  }

  private getBuckets(ts: number) {
    const idx = Math.trunc(ts/this.granularity);
    return [this.events[idx-1], this.events[idx], this.events[idx+1]];
  }

  private hasBucket(ts: number) {
    const lastTimestamp = this.events[this.events.length-1]?.start ?? 0;
    return ts < lastTimestamp + this.granularity;
  }

  private fillMissing(ts: number) {
    while (!this.hasBucket(ts)) {
      const lastTimestamp = this.events[this.events.length-1]?.start ?? 0;
      this.events.push({ start: lastTimestamp + this.granularity, data: [] });
    }
  }
}
