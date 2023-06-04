import mitt from 'mitt';

export const EVENT_OPEN_CONTACT = 'EVENT_OPEN_CONTACT';
export const EVENT_OPEN_PROMPT = 'EVENT_OPEN_PROMPT';
export const EVENT_OPEN_PLAN_PICKER_DIALOG = 'EVENT_OPEN_PLAN_PICKER_DIALOG';

const emitter = mitt();

export default emitter;
