export default function toint(i) {
    i = parseInt(i);
    if(isNaN(i)) {
        i = 0;
    }
    return i;
}