/**
 * Deploys GitHub repository-level and environment-level secrets/variables.
 * Usage: node deploy-github-config.js path/to/github-config.json
 */

const fs = require("fs");
const axios = require("axios");
const sodium = require("tweetsodium");

// ----- SHARED FUNCTIONS -----

async function getPublicKey(url, token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
  const res = await axios.get(url, { headers });
  return res.data;
}

function encryptSecret(value, publicKey) {
  const messageBytes = Buffer.from(value);
  const keyBytes = Buffer.from(publicKey.key, "base64");
  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString("base64");
}

// ----- REPO LEVEL -----

async function createOrUpdateRepoSecret(owner, repo, token, secret) {
  const { key, value } = secret;
  const pkUrl = `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`;
  const publicKey = await getPublicKey(pkUrl, token);
  const encrypted = encryptSecret(value, publicKey);

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${key}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  await axios.put(
    putUrl,
    {
      encrypted_value: encrypted,
      key_id: publicKey.key_id,
    },
    { headers }
  );

  console.log(`✅ Repo Secret "${key}"`);
}

async function createOrUpdateRepoVariable(owner, repo, token, variable) {
  const { key, value } = variable;
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/variables/${key}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    await axios.patch(url, { name: key, value }, { headers });
  } catch (err) {
    if (err.response?.status === 404) {
      await axios.post(`https://api.github.com/repos/${owner}/${repo}/actions/variables`, { name: key, value }, { headers });
    } else {
      throw err;
    }
  }

  console.log(`✅ Repo Variable "${key}"`);
}

// ----- ENV LEVEL -----

async function createOrUpdateEnvSecret(owner, repo, env, token, secret) {
  const { key, value } = secret;
  const pkUrl = `https://api.github.com/repos/${owner}/${repo}/environments/${env}/secrets/public-key`;
  const publicKey = await getPublicKey(pkUrl, token);
  const encrypted = encryptSecret(value, publicKey);

  const url = `https://api.github.com/repos/${owner}/${repo}/environments/${env}/secrets/${key}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  await axios.put(
    url,
    {
      encrypted_value: encrypted,
      key_id: publicKey.key_id,
    },
    { headers }
  );

  console.log(`✅ Env Secret "${key}" in "${env}"`);
}

async function createOrUpdateEnvVariable(owner, repo, env, token, variable) {
  const { key, value } = variable;
  const postUrl = `https://api.github.com/repos/${owner}/${repo}/environments/${env}/variables`;
  const putUrl = `https://api.github.com/repos/${owner}/${repo}/environments/${env}/variables/${key}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  try {
    // Try to create the env variable
    await axios.post(postUrl, { name: key, value }, { headers });
    console.log(`✅ Env Variable "${key}" created in "${env}"`);
  } catch (err) {
    if (err.response?.status === 409) {
      // If it already exists, update it
      await axios.put(putUrl, { name: key, value }, { headers });
      console.log(`✅ Env Variable "${key}" updated in "${env}"`);
    } else {
      // For other errors, rethrow
      throw err;
    }
  }
}

// ----- MAIN -----

async function main() {
  const configPath = process.argv[2];
  if (!configPath || !fs.existsSync(configPath)) {
    console.error("Usage: node deploy-github-config.js path/to/github-config.json");
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error(`Invalid config: ${e.message}`);
    process.exit(1);
  }

  const { token, owner, repo } = config.github || {};
  const repoSecrets = config.secrets || [];
  const repoVariables = config.variables || [];
  const envs = config.environments || {};

  if (!token || !owner || !repo) {
    console.error("Missing token, owner, or repo in config.");
    process.exit(1);
  }

  for (const secret of repoSecrets) {
    await createOrUpdateRepoSecret(owner, repo, token, secret);
  }

  for (const variable of repoVariables) {
    await createOrUpdateRepoVariable(owner, repo, token, variable);
  }

  for (const [env, cfg] of Object.entries(envs)) {
    for (const secret of cfg.secrets || []) {
      await createOrUpdateEnvSecret(owner, repo, env, token, secret);
    }
    for (const variable of cfg.variables || []) {
      await createOrUpdateEnvVariable(owner, repo, env, token, variable);
    }
  }
}

main().catch((err) => {
  console.error(`❌ Fatal error: ${err.message}`);
  process.exit(1);
});
