import './style.css';

document.querySelector('#app').innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;

const { add } = await import('./module.js');
console.log(add(1)(2));

const { exports } = await import('./src/main.zig');
console.log(exports.add(1, 2));
