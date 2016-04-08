import toint from '../utils/toint';

export default function formatTime(t) {
    var res, sec, min;
    t = toint(Math.max(t, 0));
    sec = t % 60;
    res = (sec < 10) ? '0'+sec : sec;
    t = Math.floor(t / 60);
    min = t % 60;
    res = min+':'+res;
    t = Math.floor(t / 60);
    if (t > 0) {
      if (min < 10) {
        res = '0' + res;
      }
      res = t+':'+res;
    }
    return res;
}
