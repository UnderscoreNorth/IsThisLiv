import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),
	onwarn: (warning, handler) => {
		// suppress warnings on `vite dev` and `vite build`; but even without this, things still work
		if (warning.code === "a11y-click-events-have-key-events") return;
		if (warning.code === "a11y-no-static-element-interactions") return;
		handler(warning);
	  },
	kit: {
		adapter: adapter()
	}
};

export default config;
