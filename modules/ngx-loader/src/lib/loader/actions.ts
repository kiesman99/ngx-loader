function createAction<Props extends object, T extends string>(type: T) {
  return (props: Props) => ({
    type,
    props,
  });
}
