# inside Termux
pkg install nodejs git -y
git clone <your-repo-url> arc-hub
cd arc-hub
npm install
npm run dev -- --host
