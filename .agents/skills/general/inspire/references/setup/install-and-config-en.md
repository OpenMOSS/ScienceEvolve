# Installation, configuration, and SII Proxy

[← Back to README](../../../../../../README.md) · **English** | [简体中文](install-and-config.md)

This bundled guide covers installation, updates, accounts, project initialization, and local SII proxy setup. Consult the workload-specific manuals for notebooks, compute workloads, and resources. The installed CLI's help is authoritative for available commands.

## 1. Installation

macOS and Linux are supported directly. Windows Agents use WSL2; native Windows shells are unsupported by this Inspire installation procedure.

Prerequisites: bash, curl, tar, Python 3.10+, and either uv or pipx. Install uv if needed:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Install InspireSkill:

```bash
curl -fsSL https://raw.githubusercontent.com/realZillionX/InspireSkill/main/scripts/install.sh | bash
```

The installer installs inspire-skill from PyPI, refreshes SKILL.md and references/ in detected Agent Harnesses, and installs a daily silent version check on macOS. Common options:

```bash
curl -fsSL https://raw.githubusercontent.com/realZillionX/InspireSkill/main/scripts/install.sh | bash -s -- --harness claude,codex
curl -fsSL https://raw.githubusercontent.com/realZillionX/InspireSkill/main/scripts/install.sh | bash -s -- --harness antigravity,cursor,qoder
curl -fsSL https://raw.githubusercontent.com/realZillionX/InspireSkill/main/scripts/install.sh | bash -s -- --harness qoder-work,kimi-code,kimi-desktop
curl -fsSL https://raw.githubusercontent.com/realZillionX/InspireSkill/main/scripts/install.sh | bash -s -- --no-cli
curl -fsSL https://raw.githubusercontent.com/realZillionX/InspireSkill/main/scripts/install.sh | bash -s -- --no-schedule
```

Qoder Work Skills live at ~/.qoderwork/skills/inspire/. Kimi Code uses $KIMI_CODE_HOME/skills/inspire/, defaulting to ~/.kimi-code/skills/inspire/. Kimi Desktop uses ~/Library/Application Support/kimi-desktop/daimon-share/daimon/skills/inspire/.

After installation, check:

```bash
inspire --version
inspire --help
inspire update --check
```

For command not found, open another terminal or run exec $SHELL. For missing Playwright Chromium, rerun the installer or inspire update --cli-only; installation/update repairs the global CLI browser runtime.

## 2. Updates

```bash
inspire update
inspire update --check
inspire update --cli-only
inspire update --skill-only
```

inspire update detects uv tool/pipx installations, upgrades CLI, refreshes Harness Skills, and displays GitHub release notes. --cli-only updates the package/runtime; --skill-only refreshes SKILL.md and references/.

## 3. Account configuration

Account setup is repository-independent; run anywhere:

```bash
inspire account add <name>
inspire config show --compact
inspire config check
```

account add asks for platform username, password, base URL, and proxy. Username is the login ID, not the Chinese display name. Configuration lives at ~/.inspire/accounts/<name>/config.toml.

When outside SII but local Clash Verge can route *.sii.edu.cn, use its mixed port as account proxy. Check the actual local setting; 7897 is only an example:

```text
http://127.0.0.1:7897
```

On a directly reachable SII campus network, proxy may be empty. To keep one Clash configuration, retain its mixed port and choose DIRECT in the SII Proxy group.

Account proxy takes precedence over general shell proxy settings. For compatibility, HTTP_PROXY/http_proxy, HTTPS_PROXY/https_proxy, and ALL_PROXY/all_proxy are inherited and may affect login/Browser API even without an account proxy. Inspect redacted effective source, route, and NO_PROXY matching:

```bash
inspire config show --compact --filter Proxy
```

General shell HTTP(S) proxies obey NO_PROXY/no_proxy. For direct SII routing, add .sii.edu.cn to bypass. If shell proxy settings interfere, unset both cases for a single command:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
  -u http_proxy -u https_proxy -u all_proxy inspire init
```

Do not use old one-off INSPIRE_FORCE_PROXY switches. Put stable proxy choices in account configuration.

## 4. Discovery and project initialization

Discover visible projects, project/compute-group catalogs, and default remote aliases:

```bash
inspire init
inspire resources availability --workspace all --include-cpu
```

Initialize each repository needing project context or alias overrides:

```bash
cd /path/to/your-repo
inspire init --scope project
```

./.inspire/config.toml is shared repository configuration for common [cli] settings. ./.inspire/accounts/<account>/config.toml holds account-specific project overrides. Project init records context and discovered remote aliases in that override. Use aliases rather than another remote-working-directory field:

```bash
inspire notebook exec <name> --cwd me "pwd"
inspire notebook exec <name> --cwd me:<repo> "git pull"
inspire notebook scp <name> ./config.yaml me:<repo>/config.yaml
```

To load project .env consistently for Agent inspire commands, generate a template and register it in shared project configuration:

```bash
inspire config env --output .env.example
cp .env.example .env
inspire config env use .env
```

Or register it during initialization:

```bash
inspire init --scope project --env-file .env
```

This writes [cli].env_file in ./.inspire/config.toml, not an account directory. Real parent-process environment variables still take precedence.

Account commands:

```bash
inspire account add <name2>
inspire account use <name>
inspire account rename <old-name> <new-name>
inspire account current
```

name is a local account alias/directory name, not necessarily the platform username. ~/.inspire/current is a plain one-line alias file, not a symlink. account use updates only this pointer; it neither moves nor merges accounts.

account rename moves the alias directory, updates current when applicable, and rewrites remembered notebook-target cache aliases. It does not change platform username in config.toml.

Account configuration, Web session, networked-notebook SSH connection cache, and rtunnel proxy state live under ~/.inspire/accounts/<name>/. Manage connections through notebook connection list/status/refresh/forget/prune.

Notebook connection --account takes a local alias, not a lookup by platform username. ssh/exec/shell/scp/ssh-config/ssh-proxy may resolve existing connections across accounts when omitted; all scans every account, while a concrete alias limits the search.

Only internet-enabled notebooks create/refresh SSH/rtunnel connections. Offline-zone exec/shell uses JupyterTerminal. Stage files in /inspire/... shared storage, then transfer through an internet-enabled notebook's scp or external rsync.

## 5. SII Proxy

Use Clash Verge to route *.sii.edu.cn into a dedicated SII Proxy group. Outside campus, select an available organization proxy; on a direct campus network, select DIRECT. Other traffic keeps existing subscription rules.

A common Clash Verge Rev script location is:

```text
~/Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/profiles/Script.js
```

Check the mixed port in settings, then merge SII routing into Script.js using this template. Set real node counts/ports and local mixed port. Replace placeholders with organization-provided host/port/user/password; do not commit credentials. Keep DIRECT for campus connectivity.

```javascript
var SII_PROXY_GROUP_NAME = "SII Proxy";
var SII_PROXY_NAMES = ["SII Proxy 1", "SII Proxy 2", "DIRECT"];
var SII_PROXIES = [
  {
    name: "SII Proxy 1",
    type: "socks5",
    server: "<sii-proxy-host-1>",
    port: <sii-proxy-port-1>,
    username: "<sii-proxy-user-1>",
    password: "<sii-proxy-password-1>",
    tls: false,
    udp: true,
    "skip-cert-verify": true
  },
  {
    name: "SII Proxy 2",
    type: "socks5",
    server: "<sii-proxy-host-2>",
    port: <sii-proxy-port-2>,
    username: "<sii-proxy-user-2>",
    password: "<sii-proxy-password-2>",
    tls: false,
    udp: true,
    "skip-cert-verify": true
  }
];

var SII_PROXY_GROUP = {
  name: SII_PROXY_GROUP_NAME,
  type: "select",
  proxies: SII_PROXY_NAMES
};

var SII_MANAGED_PROXY_NAMES = {
  "SII Proxy 1": 1,
  "SII Proxy 2": 1
};

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function forceUnshift(rules, rule) {
  var idx = rules.indexOf(rule);
  if (idx !== -1) rules.splice(idx, 1);
  rules.unshift(rule);
}

function upsertProxy(proxies, newProxy) {
  var out = [];
  for (var i = 0; i < proxies.length; i++) {
    if (proxies[i] && proxies[i].name === newProxy.name) continue;
    out.push(proxies[i]);
  }
  out.push(newProxy);
  return out;
}

function removeProxyNames(proxies, names) {
  var out = [];
  for (var i = 0; i < proxies.length; i++) {
    var p = proxies[i];
    if (p && p.name && names[p.name]) continue;
    out.push(p);
  }
  return out;
}

function resetSiiProxy(config) {
  config.proxies = removeProxyNames(ensureArray(config.proxies), SII_MANAGED_PROXY_NAMES);
  config["proxy-groups"] = ensureArray(config["proxy-groups"]).filter(function(group) {
    return group && group.name !== SII_PROXY_GROUP_NAME;
  });
}

function injectSiiProxy(config) {
  config.proxies = ensureArray(config.proxies);
  for (var i = 0; i < SII_PROXIES.length; i++) {
    config.proxies = upsertProxy(config.proxies, SII_PROXIES[i]);
  }

  config["proxy-groups"] = ensureArray(config["proxy-groups"]);
  config["proxy-groups"].unshift(SII_PROXY_GROUP);

  var rules = ensureArray(config.rules);
  forceUnshift(rules, "DOMAIN-SUFFIX,sii.edu.cn," + SII_PROXY_GROUP_NAME);
  config.rules = rules;
}

function main(config, profileName) {
  resetSiiProxy(config);
  injectSiiProxy(config);
  return config;
}
```

Check these three things:

```bash
lsof -iTCP:<mixed-port> -sTCP:LISTEN
curl -sS -o /dev/null -w "sii: %{http_code}\n" -x http://127.0.0.1:<mixed-port> https://qz.sii.edu.cn
inspire config check
```

If qz.sii.edu.cn fails, check the DOMAIN-SUFFIX,sii.edu.cn,SII Proxy rule, then whether the group selects an available proxy or DIRECT. Finally inspect inspire config show --compact --filter Proxy for account/shell proxy, effective routing, and NO_PROXY matches.
