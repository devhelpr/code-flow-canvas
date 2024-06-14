export let followNodeExecution = false;
export const setFollowNodeExecution = (follow: boolean) => {
  followNodeExecution = follow;
};
export const getFollowNodeExecution = () => {
  return followNodeExecution;
};
