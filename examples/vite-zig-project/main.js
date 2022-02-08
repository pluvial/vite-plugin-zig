import './style.css';

document.querySelector('#app').innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`;

const { add } = await import('./module.js');
console.log(add(5)(37));

// test cases
import './static_import';
import './static_import_instantiate';
import './dynamic_import';
import './dynamic_import_instantiate';
