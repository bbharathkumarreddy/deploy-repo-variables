/**
 * This script deploys environment variables to Bitbucket Cloud repositories.
 * npm run bitbucket-vars -- secrets/bitbucket-sample-project.json
 */
const fs = require("fs");
const axios = require("axios");

async function getEnvironments(workspace, repo, token) {
  const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/environments`;
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const envMap = Object.fromEntries(
      res.data.values.map(env => [env.name.toLowerCase(), env.uuid])
    );
    return envMap;
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    throw new Error(`Failed to fetch environments: ${msg}`);
  }
}

async function getVariableUUID(workspace, repo, token, envUUID, variableKey) {
  const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/deployments_config/environments/${envUUID}/variables`;
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const variable = res.data.values.find(v => v.key === variableKey);
    return variable ? variable.uuid : null;
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    throw new Error(`Failed to fetch variable UUID for "${variableKey}": ${msg}`);
  }
}

async function createOrUpdateVariable(workspace, repo, token, env, envUUID, variable) {
  const baseUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/deployments_config/environments/${envUUID}/variables`;
  try {
    const existingUUID = await getVariableUUID(workspace, repo, token, envUUID, variable.key);
    const url = existingUUID ? `${baseUrl}/${existingUUID}` : baseUrl;
    const method = existingUUID ? axios.put : axios.post;

    await method(url, variable, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    console.log(`✅ ${env} - ${variable.key}`);
  } catch (e) {
    console.log(`❌ ${env} - ${variable.key}`);
    const msg = e.response?.data?.error?.message || e.message;
    throw new Error(`Error processing variable "${variable.key}": ${msg}`);
  }
}

async function main() {
  const configPath = process.argv[2];
  if (!configPath || !fs.existsSync(configPath)) {
    console.error("Usage: node deploy-vars.js path/to/config.json");
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error(`Invalid config.json: ${e.message}`);
    process.exit(1);
  }

  const { token, workspace, repo } = config.bitbucket || {};
  const variables = config.variables || {};
  if (!token || !workspace || !repo) {
    console.error("Missing token, workspace, or repo in config.json");
    process.exit(1);
  }

  let envMap;
  try {
    envMap = await getEnvironments(workspace, repo, token);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  if (Object.keys(envMap).length === 0) {
    console.error("No environments found.");
    process.exit(1);
  }

  for (const [env, vars] of Object.entries(variables)) {
    const uuid = envMap[env.toLowerCase()];
    if (!uuid) continue;

    for (const v of vars) {
      try {
        await createOrUpdateVariable(workspace, repo, token, env, uuid, v);
      } catch (e) {
        console.error(e.message);
      }
    }
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
