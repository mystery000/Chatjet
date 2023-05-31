import mitt from 'mitt';

export const EVENT_OPEN_CONTACT = 'EVENT_OPEN_CONTACT';
export const EVENT_OPEN_PROMPT = 'EVENT_OPEN_PROMPT';

const emitter = mitt();

export default emitter;
