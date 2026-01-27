export function info(...args) {
  console.log(new Date().toISOString(), '[INFO]', ...args);
}

export function warn(...args) {
  console.warn(new Date().toISOString(), '[WARN]', ...args);
}

export function error(...args) {
  console.error(new Date().toISOString(), '[ERROR]', ...args);
}

export function paperLog({ token, chain, score, reason, action, price, sizeUsd }) {
  console.log('=== PAPER TRADE MODE ===');
  console.log('Action:', action);
  console.log('Token:', token);
  console.log('Chain:', chain);
  console.log('Score:', score);
  console.log('Price:', price);
  console.log('Size(USD):', sizeUsd);
  console.log('Reason:', reason);
  console.log('========================');
}

export default { info, warn, error, paperLog };
