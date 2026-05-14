import { RawMarketSignal, ProviderConfig } from "../types";

export interface MarketDataProvider {
  readonly name: string;
  readonly isAvailable: boolean;

  fetchSignals(config: ProviderConfig): Promise<RawMarketSignal[]>;
}

export abstract class BaseProvider implements MarketDataProvider {
  abstract readonly name: string;

  get isAvailable(): boolean {
    return true;
  }

  abstract fetchSignals(config: ProviderConfig): Promise<RawMarketSignal[]>;
}
