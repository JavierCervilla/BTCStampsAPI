import { StampRepository } from "$lib/database/index.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { FILTER_TYPES, STAMP_TYPES, StampBalance, SUBPROTOCOLS } from "globals";
import { DispenserManager } from "$lib/services/xcpService.ts";
import { XcpManager } from "$lib/services/xcpService.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { mimeTypes } from "utils/util.ts";

export class StampService {
  static async getStampDetailsById(
    id: string,
    filter: "open" | "closed" | "all" = "all",
  ) {
    const stampResult = await this.getStamps({
      identifier: id,
      allColumns: true,
      noPagination: true,
      cacheDuration: "never",
    });

    if (!stampResult) {
      throw new Error(`Error: Stamp ${id} not found`);
    }

    const stamp = this.extractStamp(stampResult);
    const cpid = stamp.cpid;

    const [asset, holders, dispensers, sends, dispenses, total, lastBlock] =
      await this.fetchRelatedData(stamp, cpid, filter);

    return {
      last_block: lastBlock,
      asset: asset ? asset.result : null,
      stamp,
      holders,
      sends,
      dispensers,
      dispenses,
      total: total.rows[0].total,
    };
  }

  private static extractStamp(stampResult: any) {
    if (Array.isArray(stampResult.rows)) {
      if (stampResult.rows.length === 0) {
        throw new Error(`Error: Stamp not found`);
      }
      return stampResult.rows[0];
    } else if (stampResult.stamp) {
      return stampResult.stamp;
    } else {
      return stampResult;
    }
  }

  private static async fetchRelatedData(
    stamp: any,
    cpid: string,
    filter: string,
  ) {
    const isStampOrSrc721 = stamp.ident === "STAMP" ||
      stamp.ident === "SRC-721";

    return await Promise.all([
      isStampOrSrc721 ? XcpManager.getXcpAsset(cpid) : Promise.resolve(null),
      isStampOrSrc721
        ? XcpManager.getXcpHoldersByCpid(cpid)
        : Promise.resolve([]),
      isStampOrSrc721
        ? DispenserManager.getDispensersByCpid(cpid, filter)
        : Promise.resolve([]),
      isStampOrSrc721
        ? XcpManager.getXcpSendsByCPID(cpid)
        : Promise.resolve([]),
      isStampOrSrc721
        ? DispenserManager.getDispensesByCpid(cpid)
        : Promise.resolve([]),
      StampRepository.getTotalStampCountFromDb({ type: "stamps" }),
      BlockService.getLastBlock(),
    ]);
  }

  static async getStamps(options: {
    page?: number;
    limit?: number;
    type?: STAMP_TYPES;
    ident?: SUBPROTOCOLS | SUBPROTOCOLS[];
    allColumns?: boolean;
    collectionId?: string;
    identifier?: string | number | (string | number)[];
    blockIdentifier?: number | string;
    cacheDuration?: number | "never";
    noPagination?: boolean;
    sortBy?: "desc" | "asc";
    filterBy?: FILTER_TYPES[];
  }) {
    const isMultipleStamps = Array.isArray(options.identifier);
    const isSingleStamp = !!options.identifier && !isMultipleStamps;
    const limit = options.limit || BIG_LIMIT;
    const page = options.page || 1;

    const [stamps, totalResult] = await Promise.all([
      StampRepository.getStampsFromDb({
        ...options,
        limit: isSingleStamp || isMultipleStamps ? undefined : limit,
        allColumns: isSingleStamp || isMultipleStamps
          ? true
          : options.allColumns,
        noPagination: isSingleStamp || isMultipleStamps
          ? true
          : options.noPagination,
        cacheDuration: isSingleStamp || isMultipleStamps
          ? "never"
          : options.cacheDuration,
        filterBy: options.filterBy,
      }),
      StampRepository.getTotalStampCountFromDb({
        ...options,
        filterBy: options.filterBy,
      }),
    ]);

    const totalCount =
      (totalResult as { rows: { total: number }[] }).rows[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    if (isSingleStamp) {
      return !stamps.rows.length
        ? null
        : { stamp: stamps.rows[0], total: totalCount };
    }

    if (isMultipleStamps) {
      return { stamps: stamps.rows, total: stamps.rows.length };
    }

    const paginatedData = options.noPagination
      ? stamps.rows
      : stamps.rows.slice(0, limit);

    return {
      stamps: paginatedData,
      total: totalCount,
      pages: totalPages,
      page: page,
      page_size: limit,
    };
  }

  static async getStampFile(id: string) {
    const result = await StampRepository.getStampFilenameByIdFromDb(id);
    const fileName = result?.fileName;
    const base64 = result?.base64;
    const mimeType = result?.stamp_mimetype;
    if (!fileName) {
      return { type: "notFound" };
    }

    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    if (
      !fileExtension || !Object.values(mimeTypes).includes(fileExtension as any)
    ) {
      if (base64) {
        return { type: "base64", base64: base64, mimeType: mimeType };
      }
      return { type: "notFound" };
    }

    return { type: "redirect", fileName: fileName, base64: base64 };
  }

  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
  ) {
    const [totalResult, stamps] = await Promise.all([
      StampRepository.getCountStampBalancesByAddressFromDb(address),
      StampRepository.getStampBalancesByAddressFromDb(address, limit, page),
    ]);

    const total = totalResult.rows[0]?.total || 0;

    return { stamps, total };
  }

  static async getAllCPIDs() {
    return await StampRepository.getALLCPIDs();
  }

  static mapDispensesWithRates(dispenses, dispensers) {
    const dispenserRates = new Map(
      dispensers.map((d) => [d.tx_hash, d.satoshirate]),
    );
    return dispenses.map((dispense) => ({
      ...dispense,
      satoshirate: dispenserRates.get(dispense.dispenser_tx_hash) || 0,
    }));
  }

  static async getRecentSales(page?: number, limit?: number) {
    // Fetch dispense events and extract unique asset values
    const dispenseEvents = await XcpManager.fetchDispenseEvents(500); // assuming we have 20 stamp sales in last 500 dispenses
    const uniqueAssets = [
      ...new Set(dispenseEvents.map((event) => event.params.asset)),
    ];

    const stampDetails = await this.getStamps({
      identifier: uniqueAssets,
      allColumns: true,
      noPagination: true,
    });

    const stampDetailsMap = new Map(
      stampDetails.stamps.map((stamp) => [stamp.cpid, stamp]),
    );

    const allRecentSales = dispenseEvents
      .map((event) => {
        const stamp = stampDetailsMap.get(event.params.asset);
        if (!stamp) return null;
        return {
          ...stamp,
          sale_data: {
            btc_amount: event.params.btc_amount,
            block_index: event.block_index,
            tx_hash: event.tx_hash,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.sale_data.block_index - a.sale_data.block_index);

    const total = allRecentSales.length;

    if (page !== undefined && limit !== undefined) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSales = allRecentSales.slice(startIndex, endIndex);
      return { recentSales: paginatedSales, total };
    }

    return { recentSales: allRecentSales, total };
  }

  static async getCreatorNameByAddress(
    address: string,
  ): Promise<string | null> {
    return await StampRepository.getCreatorNameByAddress(address);
  }

  static async updateCreatorName(
    address: string,
    newName: string,
  ): Promise<boolean> {
    return await StampRepository.updateCreatorName(address, newName);
  }
}
