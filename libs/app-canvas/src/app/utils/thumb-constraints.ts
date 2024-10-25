export function areThumbconstraintsCompatible(
  taskThumbConstraint: string | string[] | undefined,
  nodeThumbConstraint: string | string[] | undefined
) {
  if (
    typeof taskThumbConstraint === 'string' &&
    typeof nodeThumbConstraint === 'string'
  ) {
    return taskThumbConstraint === nodeThumbConstraint;
  }
  if (
    Array.isArray(taskThumbConstraint) &&
    Array.isArray(nodeThumbConstraint) &&
    taskThumbConstraint.length === nodeThumbConstraint.length
  ) {
    let isEqual = true;
    taskThumbConstraint.forEach((value) => {
      if (nodeThumbConstraint.indexOf(value) < 0) {
        isEqual = false;
      }
    });
    return isEqual;
  }
  if (taskThumbConstraint === undefined && nodeThumbConstraint === undefined) {
    return true;
  }
  if (
    typeof nodeThumbConstraint === 'string' &&
    Array.isArray(taskThumbConstraint)
  ) {
    return taskThumbConstraint.includes(nodeThumbConstraint);
  }
  return false;
}
