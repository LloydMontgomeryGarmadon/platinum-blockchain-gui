import { createApi } from '@reduxjs/toolkit/query/react';
import { Daemon, optionsForPlotter, defaultsForPlotter } from '@chia/api';
import type { KeyringStatus, ServiceName } from '@chia/api';
import chiaLazyBaseQuery from '../chiaLazyBaseQuery';
import onCacheEntryAddedInvalidate from '../utils/onCacheEntryAddedInvalidate';

const baseQuery = chiaLazyBaseQuery({
  service: Daemon,
});

export const daemonApi = createApi({
  reducerPath: 'daemonApi',
  baseQuery,
  tagTypes: ['KeyringStatus', 'ServiceRunning'],
  endpoints: (build) => ({
    ping: build.query<boolean, {
    }>({
      query: () => ({
        command: 'ping',
      }),
      transformResponse: (response: any) => response?.success,
    }),

    getKeyringStatus: build.query<KeyringStatus, {
    }>({
      query: () => ({
        command: 'keyringStatus',
      }),
      transformResponse: (response: any) => {
        const { status, ...rest } = response;

        return {
          ...rest,
        };
      },
      providesTags: ['KeyringStatus'],
      onCacheEntryAdded: onCacheEntryAddedInvalidate(baseQuery, [{
        command: 'onKeyringStatusChanged',
        onUpdate: (draft, data) => {
          // empty base array
          draft.splice(0);

          const { status, ...rest } = data;

          // assign new items
          Object.assign(draft, rest);
        },
      }]),
    }),
    
    startService: build.mutation<boolean, {
      service: ServiceName;
      testing?: boolean,
    }>({
      query: ({ service, testing }) => ({
        command: 'startService',
        args: [service, testing],
      }),
    }),

    stopService: build.mutation<boolean, {
      service: ServiceName;
    }>({
      query: ({ service }) => ({
        command: 'stopService',
        args: [service],
      }),
    }),

    isServiceRunning: build.query<KeyringStatus, {
      service: ServiceName;
    }>({
      query: ({ service }) => ({
        command: 'isRunning',
        args: [service],
      }),
      transformResponse: (response: any) => response?.isRunning,
      providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),
  
    setKeyringPassphrase: build.mutation<boolean, {
      currentPassphrase?: string, 
      newPassphrase?: string;
      passphraseHint?: string, 
      savePassphrase?: boolean,
    }>({
      query: ({ currentPassphrase, newPassphrase, passphraseHint, savePassphrase }) => ({
        command: 'setKeyringPassphrase',
        args: [currentPassphrase, newPassphrase, passphraseHint, savePassphrase],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }), 

    removeKeyringPassphrase: build.mutation<boolean, {
      currentPassphrase: string;
    }>({
      query: ({ currentPassphrase }) => ({
        command: 'removeKeyringPassphrase',
        args: [currentPassphrase],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }),

    migrateKeyring: build.mutation<boolean, {
      passphrase: string,
      passphraseHint: string,
      savePassphrase: boolean,
      cleanupLegacyKeyring: boolean,
    }>({
      query: ({ passphrase, passphraseHint, savePassphrase, cleanupLegacyKeyring }) => ({
        command: 'migrateKeyring',
        args: [passphrase, passphraseHint, savePassphrase, cleanupLegacyKeyring],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }),

    unlockKeyring: build.mutation<boolean, {
      key: string,
    }>({
      query: ({ key }) => ({
        command: 'unlockKeyring',
        args: [key],
      }),
      invalidatesTags: () => ['KeyringStatus'],
      transformResponse: (response: any) => response?.success,
    }),

    getPlotters: build.query<Object, undefined>({
      query: () => ({
        command: 'getPlotters',
      }),
      transformResponse: (response: any) => {
        const { plotters } = response;
        const plotterNames = Object.keys(plotters) as PlotterName[];
        const availablePlotters: PlotterMap<PlotterName, Plotter> = {};

        plotterNames.forEach((plotterName) => {
          const { 
            displayName = plotterName,
            version,
            installed,
            canInstall,
            bladebitMemoryWarning,
          } = plotters[plotterName];

          availablePlotters[plotterName] = {
            displayName,
            version,
            options: optionsForPlotter(plotterName),
            defaults: defaultsForPlotter(plotterName),
            installInfo: {
              installed,
              canInstall,
              bladebitMemoryWarning,
            },
          };
        });
        
        return availablePlotters;
      },
      // providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),

    stopPlotting: build.mutation<boolean, {
      id: string;
    }>({
      query: ({ id }) => ({
        command: 'stopPlotting',
        args: [id],
      }),
      transformResponse: (response: any) => response?.success,
      // providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),
    
    startPlotting: build.mutation<boolean, PlotAdd>({
      query: ({ 
        bladebitDisableNUMA,
        bladebitWarmStart,
        c,
        delay,
        disableBitfieldPlotting,
        excludeFinalDir,
        farmerPublicKey,
        finalLocation,
        fingerprint,
        madmaxNumBucketsPhase3,
        madmaxTempToggle,
        madmaxThreadMultiplier,
        maxRam,
        numBuckets,
        numThreads,
        overrideK,
        parallel,
        plotCount,
        plotSize,
        plotterName,
        poolPublicKey,
        queue,
        workspaceLocation,
        workspaceLocation2,
       }) => ({
        command: 'startPlotting',
        args: [
          plotterName,
          plotSize,
          plotCount,
          workspaceLocation,
          workspaceLocation2 || workspaceLocation,
          finalLocation,
          maxRam,
          numBuckets,
          numThreads,
          queue,
          fingerprint,
          parallel,
          delay,
          disableBitfieldPlotting,
          excludeFinalDir,
          overrideK,
          farmerPublicKey,
          poolPublicKey,
          c,
          bladebitDisableNUMA,
          bladebitWarmStart,
          madmaxNumBucketsPhase3,
          madmaxTempToggle,
          madmaxThreadMultiplier,
        ],
      }),
      transformResponse: (response: any) => response?.success,
      // providesTags: (_result, _err, { service }) => [{ type: 'ServiceRunning', id: service }],
    }),
  }),
});

export const { 
  usePingQuery,
  useGetKeyringStatusQuery,
  useStartServiceMutation,
  useStopServiceMutation,
  useIsServiceRunningQuery,
  useSetKeyringPassphraseMutation,
  useRemoveKeyringPassphraseMutation,
  useMigrateKeyringMutation,
  useUnlockKeyringMutation,

  useGetPlottersQuery,
  useStopPlottingMutation,
  useStartPlottingMutation,
} = daemonApi;