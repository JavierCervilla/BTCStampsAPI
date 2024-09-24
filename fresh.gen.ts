// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $api_path_ from "./routes/api/[...path].ts";
import * as $api_bitcoin_notification from "./routes/api/bitcoin-notification.ts";
import * as $api_v2_path_ from "./routes/api/v2/[...path].ts";
import * as $api_v2_balance_address_ from "./routes/api/v2/balance/[address].ts";
import * as $api_v2_balance_getStampsBalance from "./routes/api/v2/balance/getStampsBalance.ts";
import * as $api_v2_block_block_index_ from "./routes/api/v2/block/[block_index].ts";
import * as $api_v2_block_block_count_number_ from "./routes/api/v2/block/block_count/[...number].ts";
import * as $api_v2_block_related_block_index_ from "./routes/api/v2/block/related/[block_index].ts";
import * as $api_v2_collections_index from "./routes/api/v2/collections/index.ts";
import * as $api_v2_creator_name from "./routes/api/v2/creator-name.ts";
import * as $api_v2_cursed_id_ from "./routes/api/v2/cursed/[id].ts";
import * as $api_v2_cursed_block from "./routes/api/v2/cursed/block.ts";
import * as $api_v2_cursed_block_block_index_ from "./routes/api/v2/cursed/block/[block_index].ts";
import * as $api_v2_cursed_index from "./routes/api/v2/cursed/index.ts";
import * as $api_v2_docs from "./routes/api/v2/docs.ts";
import * as $api_v2_electrum_index from "./routes/api/v2/electrum/index.ts";
import * as $api_v2_health from "./routes/api/v2/health.ts";
import * as $api_v2_olga_mint from "./routes/api/v2/olga/mint.ts";
import * as $api_v2_src20_op_ from "./routes/api/v2/src20/[...op].ts";
import * as $api_v2_src20_address_address_tx from "./routes/api/v2/src20/address/[address]/tx.ts";
import * as $api_v2_src20_balance_address_ from "./routes/api/v2/src20/balance/[address].ts";
import * as $api_v2_src20_balance_address_tick_ from "./routes/api/v2/src20/balance/[address]/[tick].ts";
import * as $api_v2_src20_balance_snapshot_tick_ from "./routes/api/v2/src20/balance/snapshot/[tick].ts";
import * as $api_v2_src20_block_block_index_tick_ from "./routes/api/v2/src20/block/[block_index]/[tick].ts";
import * as $api_v2_src20_block_block_index_index from "./routes/api/v2/src20/block/[block_index]/index.ts";
import * as $api_v2_src20_create from "./routes/api/v2/src20/create.ts";
import * as $api_v2_src20_index from "./routes/api/v2/src20/index.ts";
import * as $api_v2_src20_tick_tick_address_ from "./routes/api/v2/src20/tick/[tick]/[address].tsx";
import * as $api_v2_src20_tick_tick_deploy from "./routes/api/v2/src20/tick/[tick]/deploy.ts";
import * as $api_v2_src20_tick_tick_index from "./routes/api/v2/src20/tick/[tick]/index.ts";
import * as $api_v2_src20_tick_index from "./routes/api/v2/src20/tick/index.ts";
import * as $api_v2_src20_tx_tx_hash_ from "./routes/api/v2/src20/tx/[tx_hash].ts";
import * as $api_v2_stamps_id_ from "./routes/api/v2/stamps/[id].ts";
import * as $api_v2_stamps_balance_address_ from "./routes/api/v2/stamps/balance/[address].tsx";
import * as $api_v2_stamps_block from "./routes/api/v2/stamps/block.ts";
import * as $api_v2_stamps_block_block_index_ from "./routes/api/v2/stamps/block/[block_index].ts";
import * as $api_v2_stamps_dispensers_id_ from "./routes/api/v2/stamps/dispensers/[id].ts";
import * as $api_v2_stamps_dispensers_index from "./routes/api/v2/stamps/dispensers/index.ts";
import * as $api_v2_stamps_ident_ident_ from "./routes/api/v2/stamps/ident/[ident].ts";
import * as $api_v2_stamps_index from "./routes/api/v2/stamps/index.ts";
import * as $api_v2_tx_tx_hash_ from "./routes/api/v2/tx/[tx_hash].ts";
import * as $api_v2_version from "./routes/api/v2/version.ts";
import * as $config from "./routes/config.ts";
import * as $content_imgpath_ from "./routes/content/[...imgpath].tsx";
import * as $docs_index from "./routes/docs/index.tsx";
import * as $handlers_sharedBlockWithStampsHandler from "./routes/handlers/sharedBlockWithStampsHandler.ts";
import * as $handlers_sharedCollectionHandler from "./routes/handlers/sharedCollectionHandler.ts";
import * as $handlers_sharedStampHandler from "./routes/handlers/sharedStampHandler.ts";
import * as $index from "./routes/index.tsx";
import * as $quicknode_getPrice from "./routes/quicknode/getPrice.ts";
import * as $s_id_ from "./routes/s/[...id].tsx";

import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/api/[...path].ts": $api_path_,
    "./routes/api/bitcoin-notification.ts": $api_bitcoin_notification,
    "./routes/api/v2/[...path].ts": $api_v2_path_,
    "./routes/api/v2/balance/[address].ts": $api_v2_balance_address_,
    "./routes/api/v2/balance/getStampsBalance.ts":
      $api_v2_balance_getStampsBalance,
    "./routes/api/v2/block/[block_index].ts": $api_v2_block_block_index_,
    "./routes/api/v2/block/block_count/[...number].ts":
      $api_v2_block_block_count_number_,
    "./routes/api/v2/block/related/[block_index].ts":
      $api_v2_block_related_block_index_,
    "./routes/api/v2/collections/index.ts": $api_v2_collections_index,
    "./routes/api/v2/creator-name.ts": $api_v2_creator_name,
    "./routes/api/v2/cursed/[id].ts": $api_v2_cursed_id_,
    "./routes/api/v2/cursed/block.ts": $api_v2_cursed_block,
    "./routes/api/v2/cursed/block/[block_index].ts":
      $api_v2_cursed_block_block_index_,
    "./routes/api/v2/cursed/index.ts": $api_v2_cursed_index,
    "./routes/api/v2/docs.ts": $api_v2_docs,
    "./routes/api/v2/electrum/index.ts": $api_v2_electrum_index,
    "./routes/api/v2/health.ts": $api_v2_health,
    "./routes/api/v2/olga/mint.ts": $api_v2_olga_mint,
    "./routes/api/v2/src20/[...op].ts": $api_v2_src20_op_,
    "./routes/api/v2/src20/address/[address]/tx.ts":
      $api_v2_src20_address_address_tx,
    "./routes/api/v2/src20/balance/[address].ts":
      $api_v2_src20_balance_address_,
    "./routes/api/v2/src20/balance/[address]/[tick].ts":
      $api_v2_src20_balance_address_tick_,
    "./routes/api/v2/src20/balance/snapshot/[tick].ts":
      $api_v2_src20_balance_snapshot_tick_,
    "./routes/api/v2/src20/block/[block_index]/[tick].ts":
      $api_v2_src20_block_block_index_tick_,
    "./routes/api/v2/src20/block/[block_index]/index.ts":
      $api_v2_src20_block_block_index_index,
    "./routes/api/v2/src20/create.ts": $api_v2_src20_create,
    "./routes/api/v2/src20/index.ts": $api_v2_src20_index,
    "./routes/api/v2/src20/tick/[tick]/[address].tsx":
      $api_v2_src20_tick_tick_address_,
    "./routes/api/v2/src20/tick/[tick]/deploy.ts":
      $api_v2_src20_tick_tick_deploy,
    "./routes/api/v2/src20/tick/[tick]/index.ts": $api_v2_src20_tick_tick_index,
    "./routes/api/v2/src20/tick/index.ts": $api_v2_src20_tick_index,
    "./routes/api/v2/src20/tx/[tx_hash].ts": $api_v2_src20_tx_tx_hash_,
    "./routes/api/v2/stamps/[id].ts": $api_v2_stamps_id_,
    "./routes/api/v2/stamps/balance/[address].tsx":
      $api_v2_stamps_balance_address_,
    "./routes/api/v2/stamps/block.ts": $api_v2_stamps_block,
    "./routes/api/v2/stamps/block/[block_index].ts":
      $api_v2_stamps_block_block_index_,
    "./routes/api/v2/stamps/dispensers/[id].ts": $api_v2_stamps_dispensers_id_,
    "./routes/api/v2/stamps/dispensers/index.ts":
      $api_v2_stamps_dispensers_index,
    "./routes/api/v2/stamps/ident/[ident].ts": $api_v2_stamps_ident_ident_,
    "./routes/api/v2/stamps/index.ts": $api_v2_stamps_index,
    "./routes/api/v2/tx/[tx_hash].ts": $api_v2_tx_tx_hash_,
    "./routes/api/v2/version.ts": $api_v2_version,
    "./routes/config.ts": $config,
    "./routes/content/[...imgpath].tsx": $content_imgpath_,
    "./routes/docs/index.tsx": $docs_index,
    "./routes/handlers/sharedBlockWithStampsHandler.ts":
      $handlers_sharedBlockWithStampsHandler,
    "./routes/handlers/sharedCollectionHandler.ts":
      $handlers_sharedCollectionHandler,
    "./routes/handlers/sharedStampHandler.ts": $handlers_sharedStampHandler,
    "./routes/index.tsx": $index,
    "./routes/quicknode/getPrice.ts": $quicknode_getPrice,
    "./routes/s/[...id].tsx": $s_id_,
  },
  islands: {},
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
