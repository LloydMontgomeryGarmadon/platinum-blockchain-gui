import EventEmitter from 'events';
import { isUndefined, omitBy } from 'lodash';
import type Connection from '../Connection';
import Message from '../Message';

export type Options = {
  origin?: string;
};

export default class Service extends EventEmitter {
  private _connection: Connection;
  private _destination: string;
  private _origin: string;
  private _registered: boolean = false;

  constructor(name: string, connection: Connection, options: Options = {}) {
    super();

    const { origin } = options;

    this._connection = connection;
    this._destination = name;
    this._origin = origin ?? connection.origin;

    connection.addService(this);
    connection.on('message', this.handleMessage);
  }

  get destination() {
    return this._destination;
  }

  get connection() {
    return this._connection;
  }

  get origin() {
    return this._origin;
  }

  get registered() {
    return this._registered;
  }

  handleMessage = (message: Message) => {
    if (message.destination !== this.destination) {
      return;
    }

    this.processMessage(message);
  }

  processMessage(message: Message) {
    if (message.command === 'register_service') {
      console.log('service was registered', this.destination);
      this._registered = true;
      this.emit('ready');
    }

    if (message.command) {
      this.emit(message.command, message.data, message);
    }    
  }

  async command(command: string, data: Object = {}, ack: boolean = false): Promise<any> {
    const { connection, origin, destination } = this;

    if (!command) {
      throw new Error('Command is required parameter');
    }

    // remove undefined values from root data
    const updatedData = omitBy(data, isUndefined);

    const response = await connection.send(new Message({
      origin,
      destination,
      command,
      data: updatedData,
      ack,
    }));

    console.log('response', response);

    return response?.data;
  }

  async ping() {
    return this.command('ping');
  }

  onCommand(
    command: string, 
    callback: (data: any, message: Message) => void,
    processData?: (data: any) => any,
  ): () => void {
    function handleCommand(currentCommand: string, data: any, message: Message) {
      if (currentCommand === command) {
        const updatedData = processData ? processData(data, message) : data;
        callback(updatedData, message);
      }
    }

    this.on('command', handleCommand);

    return () => {
      this.off('command', handleCommand);
    };
  }

  onStateChanged(
    state: string,
    callback: (data: any, message: Message) => void,
    processData?: (data: any) => any,
  ) {
    return this.onCommand('state_changed', (data, message) => {
      if (data.state === state) {
        callback(data, message);
      }
    }, processData);
  }
}