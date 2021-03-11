const fix0 = (n, beam) => {
  const s = "000000000000000" + n;
  return s.substring(s.length - beam);
};

export { fix0 };
