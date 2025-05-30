// Mock for Node.js 'child_process' module
module.exports = {
  exec: () => { throw new Error('child_process not supported in React Native'); },
  spawn: () => { throw new Error('child_process not supported in React Native'); },
  fork: () => { throw new Error('child_process not supported in React Native'); },
  execSync: () => { throw new Error('child_process not supported in React Native'); },
};