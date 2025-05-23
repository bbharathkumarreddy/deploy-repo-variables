# Deploy Repo Variables

An open source utility for deploying environment variables/secrets to GitHub and Bitbucket repositories using JSON configuration files.


## 🚀 Deployment Commands

### Deploy to Bitbucket

```bash
npm run bitbucket-vars -- repo-secrets/<project-name>/<repo-name-config>.json
```

### Deploy to GitHub

```bash
npm run github-vars -- repo-secrets/<project-name>/<repo-name-config>.json
```

## 🛠️ JSON Configuration Format

- [GitHub Sample Project JSON](./secrets/github-sample-project.json)
- [Bitbucket Sample Project JSON](./secrets/bitbucket-sample-project.json)


## ✅ Setup Instructions

1. Install dependencies: `npm install`

2. Create the config file: `repo-secrets/<project-name>/<repo-name-config>.json`

3. `token`: The token inside the config file refers to the Authentication section below.

## 🔐 Authentication

**Github:** Use Personal Access Tokens with secrets and variables `Read and write` access.  
**Bitbucket:** Use Access Tokens with `Edit variables` scope.

## 📦 License

MIT License
