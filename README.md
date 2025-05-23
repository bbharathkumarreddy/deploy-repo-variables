# Deploy Repo Variables

A utility for deploying environment variables/secrets to GitHub and Bitbucket repositories using JSON configuration files.


## 🚀 Deployment Commands

### Deploy to Bitbucket

```bash
npm run bitbucket-vars -- repo-secrets/<path-to-bitbucket-repo-config>.json
```

### Deploy to GitHub

```bash
npm run github-vars -- repo-secrets/<path-to-github-repo-config>.json

```

## 🛠️ JSON Configuration Format

- [GitHub Sample Project JSON](./secrets/github-sample-project.json)
- [Bitbucket Sample Project JSON](./secrets/bitbucket-sample-project.json)


## ✅ Setup Instructions

1. Install dependencies: `npm install`

2. Create the secret config files: `repo-secrets/<project name>/<repo name>.json`

3. `token`: Refer "Authentication" section.

## 🔐 Authentication

**Github:** Use Personal Access Tokens with secrets and variables `Read and write` access.
**Bitbucket:** Use Access Tokens with `Edit variables` scope.

## 📦 License

MIT License
