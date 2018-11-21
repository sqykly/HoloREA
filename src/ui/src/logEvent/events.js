const events = [
    "accept",
    "cite",
    "consume",
    "give",
    "improve",
    "produce",
    "take",
    "use",
    "work"
  ];

  const eventOptions = events.map((ev) => ({
    value: ev,
    label: ev
  }));

  export default eventOptions
  