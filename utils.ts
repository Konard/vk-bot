import { DateTime } from 'luxon';
import * as timeUnits from './time-units';
import * as fs from 'fs';

interface App {
  gracefullyFinished: boolean;
}

const app: App = {
  gracefullyFinished: false,
};

const priorityFriendIds: number[] = [
  450527,
  138919441,
  142032068,
  223625489,
  226531679,
  243646872,
  557672854,
  1025353969,
];

interface TriggerState {
  lastTriggered?: DateTime;
}

interface PeerState {
  history?: any[];
  triggers?: Record<string, TriggerState>;
}

interface Attachment {
  id?: number;
  sticker?: {
    sticker_id: number;
  };
}

interface MessageContext {
  attachments?: Attachment[];
}

interface TriggerContext {
  vk?: any;
  request?: {
    peerId?: number;
    [key: string]: any;
  };
  states?: Record<number, PeerState>;
  state?: PeerState | undefined;
  options?: any;
}

interface Trigger {
  name: string;
  condition?: (context: TriggerContext) => Promise<boolean> | boolean;
  action: (context: TriggerContext) => Promise<void> | void;
}

function getToken(filePath: string = 'token'): string {
  let content: string;

  // Try to read the file
  try {
    content = fs.readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    throw new Error(`Error: Unable to read file "${filePath}". Please make sure the file exists and is accessible.`, { cause: error });
  }

  // Try to parse the content as a URL but handle URL parsing errors as warnings
  let token: string | null = null;
  try {
    token = getTokenFromUrl(content);
  } catch (error) {
    console.warn('Warning: Failed to parse URL. Treating the file content as a possible token instead.');
  }

  // If a token was extracted from the URL, validate it
  if (token) {
    if (isValidTokenSyntax(token)) {
      return token; // Successfully retrieved a valid token from the URL
    } else {
      throw new Error('Error: The token extracted from the URL has an invalid format.');
    }
  }

  // If URL parsing failed or there was no token in the URL, treat the content as a raw token
  if (isValidTokenSyntax(content)) {
    return content; // The file content itself is a valid token
  } else {
    throw new Error('Error: The file content is not a valid token or URL.');
  }
}

function getTokenFromUrl(url: string): string | null {
  // Try to create a new URL object and check if the hash part exists
  try {
    const urlObj = new URL(url);

    // Check if the hash part is empty
    if (!urlObj.hash) {
      return null;
    }

    // Get the hash part of the URL (everything after the #)
    const hash = urlObj.hash.substring(1); // Remove the leading '#'

    // Use URLSearchParams to parse the hash
    const params = new URLSearchParams(hash);

    // Get the access_token
    return params.get('access_token');
  } catch (error) {
    // If URL parsing fails, return null and allow the process to continue
    throw new Error('Invalid URL format provided.', { cause: error });
  }
}

function isValidTokenSyntax(token: string): boolean {
  // Define a regex pattern for validating the token
  const tokenPattern = /^[a-zA-Z0-9_\-\.]+$/;
  return tokenPattern.test(token);
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const hasSticker = (context: MessageContext | undefined, stickersIds: number[]): boolean => {
  for (const attachment of context?.attachments || []) {
    if (attachment?.id) {
      const stickerId = attachment.id;
      // console.log('stickerId', stickerId);
      return stickersIds.includes(stickerId);
    } else {
      const stickerId = attachment?.sticker?.sticker_id;
      // console.log('stickerId', stickerId);
      if (stickerId) {
        return stickersIds.includes(stickerId);
      }
    }
  }
  return false;
};

const sleep = (msOrPrefix: number | string, msOrNull?: number): Promise<void> => new Promise(resolve => {
  const prefix = typeof msOrPrefix === 'string' ? msOrPrefix : null;
  const ms = msOrNull || (msOrPrefix as number);
  const startMessage = prefix ? `${prefix} Sleeping for ${ms} ms...` : `Sleeping for ${ms} ms...`;
  console.log(startMessage);
  setTimeout(() => {
    const endMessage = prefix ? `${prefix} Wake up after ${ms} ms.` : `Wake up after ${ms} ms.`;
    console.log(endMessage);
    resolve();
  }, ms);
});

function eraseMetadata(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

function clean(obj: Record<string, any>): Record<string, any> {
  for (const propName in obj) {
    if (obj[propName] === null || obj[propName] === undefined || obj[propName]?.length === 0) {
      delete obj[propName];
    }
    // if(typeof obj[propName] === 'object'){
    //   clean(obj[propName]); //recursive for nested objects
    // }
  }
  return obj;
}

const defaultEncoding = 'utf-8';

function readTextSync(path: string): string {
  return fs.readFileSync(path, { encoding: defaultEncoding });
}

function readJsonSync(path: string): any {
  return JSON.parse(readTextSync(path));
}

function saveTextSync(path: string, text: string): void {
  fs.writeFileSync(path, text, { encoding: defaultEncoding });
}

function saveJsonSync(path: string, obj: any): void {
  saveTextSync(path, JSON.stringify(obj, null, 2));
}

async function executeTrigger(trigger: Trigger, context: TriggerContext): Promise<void> {
  if (!trigger) {
    return;
  }
  let peerState: PeerState | undefined;
  const peerId = context?.request?.peerId;
  if (context?.states && peerId) {
    peerState = context.states[peerId];
  }
  const currentContext: TriggerContext = { ...context, state: peerState };
  console.log(`Checking for '${trigger.name}' trigger...`);
  if (!trigger.condition || (await trigger.condition(currentContext))) {
    try {
      console.log(`'${trigger.name}' trigger selected to be executed.`);
      const start = new Date();
      await trigger.action(currentContext);
      console.log(`'${trigger.name}' trigger is executed in ${new Date().getTime() - start.getTime()} ms.`);
      if (peerState && trigger.name) {
        const triggers = peerState.triggers ??= {};
        const triggerState = triggers[trigger.name] ??= {};
        triggerState.lastTriggered = DateTime.now();
        console.log(`'${trigger.name}' trigger has updated the state for user ${peerId}:`, JSON.stringify(peerState, null, 2));
      }
    } catch (e) {
      console.error(`Execution of '${trigger.name}' trigger is failed:`, e);
    }
  } else {
    console.log(`No need to execute '${trigger.name}' trigger.`);
  }
}

export {
  getToken,
  getRandomElement,
  hasSticker,
  sleep,
  executeTrigger,
  eraseMetadata,
  clean,
  readTextSync,
  readJsonSync,
  saveTextSync,
  saveJsonSync,
  app,
  priorityFriendIds,
  type Trigger,
  type TriggerContext,
  type PeerState,
  type TriggerState,
  type Attachment,
  type MessageContext,
};

// Re-export time units
export * from './time-units';