import { createElementFromHtml } from '../utils/createElementFromHtml';

export const getLoop = () => {
  // Create a loop shape
  return createElementFromHtml(`<svg class="h-[72px] w-[72px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 18H7C5.34315 18 4 16.6569 4 15V9C4 7.34315 5.34315 6 7 6H17C18.6569 6 20 7.34315 20 9V15C20 16.6569 18.6569 18 17 18H12M12 18L15 15M12 18L15 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);
};
