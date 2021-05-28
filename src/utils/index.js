function getPrivateKey() {
  const privateKeyString = process.env.JWT_PRIVATE_KEY;
  const newlineReplacementRegex = /\\n/gm;
  const formattedString = privateKeyString.replace(newlineReplacementRegex, '\n');
  console.log(formattedString);
  return formattedString;
}

module.exports = {
  getPrivateKey,
};
