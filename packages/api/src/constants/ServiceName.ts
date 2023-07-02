const ServiceName = {
  WALLET: 'platinum_wallet',
  FULL_NODE: 'platinum_full_node',
  FARMER: 'platinum_farmer',
  HARVESTER: 'platinum_harvester',
  SIMULATOR: 'platinum_full_node_simulator',
  DAEMON: 'daemon',
  PLOTTER: 'platinum_plotter',
  TIMELORD: 'platinum_timelord',
  INTRODUCER: 'platinum_introducer',
  EVENTS: 'wallet_ui',
  DATALAYER: 'platinum_data_layer',
  DATALAYER_SERVER: 'platinum_data_layer_http',
} as const;

type ObjectValues<T> = T[keyof T];

export type ServiceNameValue = ObjectValues<typeof ServiceName>;

export default ServiceName;
