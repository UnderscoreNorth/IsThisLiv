# IsThisLiv

Front and backend using Svelte, Express, and MySql

## Installing front end

Create svelte/src/config.json

```json
{
  "api": "backend url and port"
}
```

Terminal

```bash
cd svelte
npm install
npm run dev
```

## Installing back end

Create express/config.json

```json
{
  "sql": {
    "host": "",
    "user": "",
    "password": "",
    "database": ""
  },
  "port": ""
}
```

Terminal

```bash
cd express
npm install
npm run dev
```
