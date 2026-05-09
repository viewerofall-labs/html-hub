import manifest from './files.json';

const LOCKDOWN_KEY = 'CHElc&3=5g';
const KV_NAMESPACE = 'FILE_HUB';
const CONTROL_PANEL_URL = 'https://devpanel.joemomanugget.workers.dev';
const CONTROL_TOKEN = 'CHElc&3=5g';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const pathname = url.pathname;

		const isLocked = await env[KV_NAMESPACE].get('locked') === 'true';

		if (pathname === '/api/lockdown' && request.method === 'POST') {
			const body = await request.json();
			if (body.key !== LOCKDOWN_KEY) {
				return new Response(JSON.stringify({ error: 'Invalid key' }), { status: 403 });
			}
			const action = body.action;
			await env[KV_NAMESPACE].put('locked', action === 'lock' ? 'true' : 'false');
			return new Response(JSON.stringify({ status: action === 'lock' ? 'locked' : 'unlocked' }));
		}

		if (isLocked) {
			return new Response(getLockdownHTML(), { headers: { 'Content-Type': 'text/html' }, status: 403 });
		}

		if (pathname === '/' || pathname === '/index.html') {
			return new Response(await getHubHTML(env), { headers: { 'Content-Type': 'text/html' } });
		}

		if (pathname === '/api/files') {
			return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json' } });
		}

		const filePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
		const file = manifest.find(f => f.path === filePath);
		if (!file) {
			return new Response('File not found', { status: 404 });
		}

		const githubUrl = `https://raw.githubusercontent.com/viewerofall-labs/html-hub/main/${file.path}`;
		const response = await fetch(githubUrl, {
			headers: {
				'User-Agent': 'File-Hub-Worker'
			}
		});

		if (!response.ok) {
			return new Response('File fetch failed', { status: response.status });
		}

		const content = await response.text();
		const contentType = file.path.endsWith('.html') ? 'text/html' : 'text/plain';

		return new Response(content, { headers: { 'Content-Type': contentType } });
	},
};

async function getHubHTML(env) {
	let bannerHTML = '';
	try {
		const state = await env[KV_NAMESPACE].get('global_state');
		const config = state ? JSON.parse(state) : {};
		if (config.banner?.enabled) {
			const bgColor = config.banner.color === 'warning' ? '#ffaa44' : config.banner.color || '#c792ea';
			bannerHTML = `<div style="background: ${bgColor}; color: #0a0010; padding: 12px; text-align: center; font-weight: bold; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">
			${config.banner.content}
			</div>`;
		}
	} catch (e) {
		// silently fail if control panel not set up yet
	}

	return `<!DOCTYPE html>
	<html lang="en">
	<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>File Hub</title>
	<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	html, body { width: 100%; height: 100%; }
	body { font-family: 'Inconsolata', monospace; background: #0a0010; color: #c792ea; display: flex; margin-top: ${bannerHTML ? '50px' : '0'}; }
	.sidebar { width: 280px; background: #0f0015; border-right: 2px solid #c792ea; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; }
	.search-box { width: 100%; padding: 10px; background: #1a001f; border: 1px solid #00e5c8; color: #c792ea; border-radius: 4px; font-family: 'Inconsolata', monospace; }
	.file-list { flex: 1; overflow-y: auto; }
	.file-item { padding: 8px 10px; cursor: pointer; border-radius: 3px; transition: all 0.2s; font-size: 14px; word-break: break-word; }
	.file-item:hover { background: #1a001f; color: #00e5c8; }
	.file-item.active { background: #c792ea; color: #0a0010; }
	.folder-header { font-weight: bold; color: #00e5c8; margin-top: 10px; font-size: 12px; text-transform: uppercase; }
	.content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
	.toolbar { background: #1a001f; border-bottom: 2px solid #c792ea; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
	.toolbar-left { display: flex; gap: 10px; align-items: center; }
	.breadcrumb { color: #00e5c8; font-size: 13px; }
	.exit-btn { padding: 6px 12px; background: #c792ea; border: none; color: #0a0010; border-radius: 3px; cursor: pointer; font-weight: bold; transition: all 0.2s; font-family: 'Inconsolata', monospace; }
	.exit-btn:hover { background: #00e5c8; }
	#viewContainer { flex: 1; overflow: hidden; }
	.iframe-container { width: 100%; height: 100%; border: none; }
	.no-file { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 18px; }
	</style>
	</head>
	<body>
	${bannerHTML}
	<div class="sidebar">
	<input type="text" class="search-box" id="search" placeholder="Search files...">
	<div class="file-list" id="fileList"></div>
	</div>
	<div class="content">
	<div class="toolbar">
	<div class="toolbar-left">
	<span class="breadcrumb" id="breadcrumb">Select a file</span>
	</div>
	<button class="exit-btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
	<button class="exit-btn" onclick="exitFile()">← Exit</button>
	</div>
	<div id="viewContainer"><div class="no-file">Select a file to load</div></div>
	</div>
	<script>
	let files = [];
	let currentFile = null;
	async function loadFiles() {
		const res = await fetch('/api/files');
		files = await res.json();
		renderFileList(files);
	}
	function renderFileList(filteredFiles) {
		const fileList = document.getElementById('fileList');
		fileList.innerHTML = '';
		const grouped = {};
		filteredFiles.forEach(file => {
			const folder = file.folder || 'root';
			if (!grouped[folder]) grouped[folder] = [];
			grouped[folder].push(file);
		});
		if (grouped['.']) {
			grouped['.'].forEach(file => {
				const item = createFileItem(file);
				fileList.appendChild(item);
			});
		}
		Object.keys(grouped).filter(k => k !== '.').sort().forEach(folder => {
			const header = document.createElement('div');
			header.className = 'folder-header';
			header.textContent = folder;
			fileList.appendChild(header);
			grouped[folder].forEach(file => {
				const item = createFileItem(file);
				fileList.appendChild(item);
			});
		});
	}
	function createFileItem(file) {
		const item = document.createElement('div');
		item.className = 'file-item';
		item.textContent = file.name;
		item.onclick = (e) => loadFile(file, e);
		return item;
	}
	function loadFile(file, event) {
		currentFile = file;
		const viewContainer = document.getElementById('viewContainer');
		const breadcrumb = document.getElementById('breadcrumb');
		breadcrumb.textContent = file.path;
		viewContainer.innerHTML = '<iframe src="/' + file.path + '" class="iframe-container" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>';
		document.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
		event.target.classList.add('active');
	}
	function exitFile() {
		currentFile = null;
		const viewContainer = document.getElementById('viewContainer');
		const breadcrumb = document.getElementById('breadcrumb');
		viewContainer.innerHTML = '<div class="no-file">Select a file to load</div>';
		breadcrumb.textContent = 'Select a file';
		document.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
	}
	function toggleFullscreen() {
		const viewContainer = document.getElementById('viewContainer');
		const sidebar = document.querySelector('.sidebar');
		const toolbar = document.querySelector('.toolbar');

		if (viewContainer.classList.contains('fullscreen')) {
			viewContainer.classList.remove('fullscreen');
			sidebar.style.display = 'flex';
			toolbar.style.display = 'flex';
		} else {
			viewContainer.classList.add('fullscreen');
			sidebar.style.display = 'none';
			toolbar.style.display = 'none';
		}
	}
	document.getElementById('search').addEventListener('input', (e) => {
		const query = e.target.value.toLowerCase();
		const filtered = files.filter(f => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query));
		renderFileList(filtered);
	});
	loadFiles();
	</script>
	</body>
	</html>`;
}

function getLockdownHTML() {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Lockdown</title>
	<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body { font-family: 'Inconsolata', monospace; background: #0a0010; color: #c792ea; display: flex; align-items: center; justify-content: center; height: 100vh; }
	.lockdown-container { text-align: center; font-size: 24px; }
	</style>
	</head>
	<body>
	<div class="lockdown-container">🔒 Lockdown active, server will be up soon</div>
	</body>
	</html>`;
}
