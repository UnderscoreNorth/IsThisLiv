import adapter from '@sveltejs/adapter-static';
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
		adapter: adapter({strict:false}),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// ignore deliberate link to shiny 404 page
				if (['/files','/booru/'].includes(path)) {
					return;
				}
				// otherwise fail the build
				throw new Error(message);
			}
		}
	}
};

export default config;
