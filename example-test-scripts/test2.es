let a = 1;
let b = 3;
let c = 4;
showValue(a + b + 100 * b);

showValue(c);

if (c < 100) {
  showValue(c);
} else {
  showValue(c + 100);
}

c = c + 200;

showValue(c);
