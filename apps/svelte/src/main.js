import { mount } from 'svelte';
import '@gmc/shared/styles.css';
import App from './App.svelte';

export default mount(App, { target: document.getElementById('app') });
