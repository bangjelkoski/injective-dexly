import { getNetworkEndpoints, Network } from "@injectivelabs/networks";
import {
  Msgs,
  TxGrpcApi,
  hexToBuff,
  hexToBase64,
  SIGN_AMINO,
  BaseAccount,
  ChainGrpcBankApi,
  ChainRestAuthApi,
  createTransaction,
  createTxRawEIP712,
  createWeb3Extension,
  getEip712TypedData,
  getEthereumAddress,
  IndexerGrpcSpotApi,
  ChainRestTendermintApi,
} from "@injectivelabs/sdk-ts";
import {
  sleep,
  getStdFee,
  BigNumberInBase,
  DEFAULT_GAS_LIMIT,
  DEFAULT_BLOCK_TIMEOUT_HEIGHT,
} from "@injectivelabs/utils";
import { EthereumChainId, ChainId } from "@injectivelabs/ts-types";
import {
  ErrorType,
  MetamaskException,
  TransactionException,
  UnspecifiedErrorCode,
} from "@injectivelabs/exceptions";
import { recoverTypedSignaturePubKey } from "@injectivelabs/sdk-ts";
import { Web3Client, Web3Composer } from "@injectivelabs/sdk-ui-ts";

export const CHAIN_ID = ChainId.Mainnet;
export const ETHEREUM_CHAIN_ID = EthereumChainId.Mainnet;
export const NETWORK = Network.MainnetK8s;
export const alchemyRpcEndpoint = `https://eth-mainnet.alchemyapi.io/v2/${
  import.meta.env.VITE_ALCHEMY_KEY
}`;
export const ENDPOINTS = getNetworkEndpoints(NETWORK);
export const chainGrpcBankApi = new ChainGrpcBankApi(ENDPOINTS.grpc);
export const indexerGrpcSpotApi = new IndexerGrpcSpotApi(ENDPOINTS.indexer);

export const web3Client = new Web3Client({
  network: NETWORK,
  rpc: alchemyRpcEndpoint,
});
export const web3Composer = new Web3Composer({
  network: NETWORK,
  rpc: alchemyRpcEndpoint,
  ethereumChainId: ETHEREUM_CHAIN_ID,
});

export const createAndBroadcastTransaction = async ({
  address,
  message,
}: {
  address: string;
  message: Msgs;
}) => {
  const signEip712TypedData = async (
    ethereumAddress: string,
    eip712json: string
  ) => {
    try {
      return await (window as any).ethereum.request({
        method: "eth_signTypedData_v4",
        params: [ethereumAddress, eip712json],
      });
    } catch (e: unknown) {
      throw new MetamaskException(new Error((e as any).message), {
        code: UnspecifiedErrorCode,
        type: ErrorType.WalletError,
      });
    }
  };

  const ethereumAddress = getEthereumAddress(address);

  /** Account Details **/
  const chainRestAuthApi = new ChainRestAuthApi(ENDPOINTS.rest);
  const accountDetailsResponse = await chainRestAuthApi.fetchAccount(address);
  const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);
  const accountDetails = baseAccount.toAccountDetails();

  /** Block Details */
  const chainRestTendermintApi = new ChainRestTendermintApi(ENDPOINTS.rest);
  const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
  const latestHeight = latestBlock.header.height;
  const timeoutHeight = new BigNumberInBase(latestHeight).plus(
    DEFAULT_BLOCK_TIMEOUT_HEIGHT
  );

  /** EIP712 for signing on Ethereum wallets */
  const eip712TypedData = getEip712TypedData({
    msgs: message,
    fee: getStdFee(DEFAULT_GAS_LIMIT.toString()),
    tx: {
      accountNumber: accountDetails.accountNumber.toString(),
      sequence: accountDetails.sequence.toString(),
      timeoutHeight: timeoutHeight.toFixed(),
      chainId: ChainId.Mainnet,
    },
    ethereumChainId: ETHEREUM_CHAIN_ID,
  });

  /** Signing on Ethereum */
  const signature = await signEip712TypedData(
    ethereumAddress,
    JSON.stringify(eip712TypedData)
  );
  const signatureBuff = hexToBuff(signature);

  /** Get Public Key of the signer */
  const publicKeyHex = recoverTypedSignaturePubKey(eip712TypedData, signature);
  const publicKeyBase64 = hexToBase64(publicKeyHex);

  /** Preparing the transaction for client broadcasting */
  const txApi = new TxGrpcApi(ENDPOINTS.grpc);
  const { txRaw } = createTransaction({
    chainId: CHAIN_ID,
    message: message,
    signMode: SIGN_AMINO,
    fee: getStdFee(DEFAULT_GAS_LIMIT.toString()),
    pubKey: publicKeyBase64,
    sequence: baseAccount.sequence,
    timeoutHeight: timeoutHeight.toNumber(),
    accountNumber: baseAccount.accountNumber,
  });

  const web3Extension = createWeb3Extension({
    ethereumChainId: ETHEREUM_CHAIN_ID,
  });
  const txRawEip712 = createTxRawEIP712(txRaw, web3Extension);

  /** Append Signatures */
  txRawEip712.signatures = [signatureBuff];

  /** Broadcast the transaction */
  const response = await txApi.broadcast(txRawEip712);

  if (response.code !== 0) {
    throw new TransactionException(new Error(response.rawLog), {
      code: UnspecifiedErrorCode,
      contextCode: response.code,
      contextModule: response.codespace,
    });
  }

  return response;
};

export const broadcastWeb3Transaction = async (transaction: any) => {
  const sendWeb3Transaction = async (transaction: unknown) => {
    try {
      return await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [transaction],
      });
    } catch (e: unknown) {
      throw new MetamaskException(new Error((e as any).message), {
        code: UnspecifiedErrorCode,
        type: ErrorType.WalletError,
      });
    }
  };

  const getEthereumTransactionReceipt = async (txHash: string) => {
    const ethereum = (window as any).ethereum;

    const interval = 1000;
    const transactionReceiptRetry = async () => {
      const receipt = await ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });

      if (!receipt) {
        await sleep(interval);
        await transactionReceiptRetry();
      }

      return receipt;
    };

    try {
      return await transactionReceiptRetry();
    } catch (e: unknown) {
      throw new MetamaskException(new Error((e as any).message), {
        code: UnspecifiedErrorCode,
        type: ErrorType.WalletError,
      });
    }
  };

  // Broadcast the transaction and wait for it to be included in a block
  return await new Promise((resolve, reject) => {
    sendWeb3Transaction(transaction)
      .then(async (txHash) => {
        getEthereumTransactionReceipt(txHash).then(() => {
          resolve(txHash);
        });
      })
      .catch(reject);
  });
};
