# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


## Navigation par rôle (version harmonisée)

Le composant `src/layouts/Sidebar.jsx` affiche une navigation distincte selon le rôle enregistré (`ADMIN`, `GESTIONNAIRE`, `VALIDEUR`, `JURIDIQUE`). Les quatre layouts partagent la structure visuelle mais le contenu du menu est spécifique à chaque rôle. Les routes doivent exister dans `src/App.jsx` pour être accessibles.

Important : masquer un lien dans le frontend ne sécurise pas une ressource. Les autorisations et le périmètre de chaque utilisateur doivent également être vérifiés côté backend Spring Security / contrôleurs / services.


## Navigation par rôle

Le composant `src/layouts/Sidebar.jsx` choisit les liens selon le rôle retourné à la connexion : `ADMIN`, `GESTIONNAIRE`, `VALIDEUR` ou `JURIDIQUE`. Chaque rôle possède son tableau de bord et ses propres routes dans `src/App.jsx`.

Les pages de contrats, documents, avenants, notifications et d'administration utilisent les endpoints du backend. Les liens masqués dans l'interface ne remplacent pas les contrôles d'autorisation Spring Boot.

### URL du backend

En développement, l'interface appelle `http://localhost:8080/api`. Pour une compilation de production, elle utilise par défaut `/api` sur le même domaine que le frontend (à publier derrière un reverse proxy vers Spring Boot). Si l'API est hébergée sur un domaine distinct, définir `REACT_APP_API_URL` avant `npm run build`, avec son chemin `/api` complet, par exemple `https://api.exemple.mg/api`.
