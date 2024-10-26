export function areThumbconstraintsCompatible(
  taskThumbConstraint: string | string[] | undefined,
  nodeThumbConstraint: string | string[] | undefined
) {
  if (taskThumbConstraint === undefined) {
    return true;
  }
  if (
    typeof taskThumbConstraint === 'string' &&
    typeof nodeThumbConstraint === 'string'
  ) {
    return taskThumbConstraint === nodeThumbConstraint;
  }
  if (
    Array.isArray(taskThumbConstraint) &&
    Array.isArray(nodeThumbConstraint)
  ) {
    let hasCompatibleNodeType = false;
    nodeThumbConstraint.forEach((value) => {
      if (taskThumbConstraint.indexOf(value) >= 0) {
        hasCompatibleNodeType = true;
      }
    });
    return hasCompatibleNodeType;
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
