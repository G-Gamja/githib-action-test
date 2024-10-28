import { readFileSync, writeFileSync, rmSync } from "fs";
import cryptoJS from "crypto-js";

const nativeCoinContractAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  try {
    const apiKey = process.env.API_KEY;
    const secretKey = process.env.SECRET_KEY;

    console.log("🚀 ~ main ~ secretKey:", secretKey);

    const passphrase = process.env.PASSPHRASE;

    const date = new Date(); // Get the current time
    const timestamp = date.toISOString();

    const chain = process.argv[2];

    console.log("🚀 ~ main ~ chain:", chain);

    const chainId = process.argv[3];

    console.log("🚀 ~ main ~ chainId:", chainId);

    if (!chain || !chainId) {
      throw new Error("Missing chain or chainId");
    }

    const fileName = `./chain/${chain}/erc20_2.json`;
    const currentAssets = JSON.parse(readFileSync(fileName, "utf-8"));

    const response = await fetch(
      "https://www.okx.com/api/v5/dex/aggregator/all-tokens?chainId=1",
      {
        headers: {
          "OK-ACCESS-KEY": apiKey,
          "OK-ACCESS-SIGN": cryptoJS.enc.Base64.stringify(
            cryptoJS.HmacSHA256(
              timestamp +
                "GET" +
                `/api/v5/dex/aggregator/all-tokens?chainId=${chainId}`,
              secretKey
            )
          ),
          "OK-ACCESS-TIMESTAMP": timestamp,
          "OK-ACCESS-PASSPHRASE": passphrase,
        },
      }
    );

    const jsonResponse = await response.json();

    console.log("🚀 ~ main ~ jsonResponse:", jsonResponse);

    const erc20Assets = jsonResponse.data;

    console.log("🚀 ~ main ~ erc20Assets:", erc20Assets);

    const currentAssetContractAddresses = currentAssets.map((asset) => {
      return asset.contract.toLowerCase();
    });

    const assetsToAdd = erc20Assets
      .filter((asset) => {
        return (
          !currentAssetContractAddresses.includes(
            asset.tokenContractAddress.toLowerCase()
          ) &&
          asset.tokenContractAddress.toLowerCase() !==
            nativeCoinContractAddress.toLowerCase()
        );
      })
      .map((asset) => ({
        type: "erc20",
        contract: asset.tokenContractAddress,
        name: asset.tokenName,
        symbol: asset.tokenSymbol,
        description: "",
        decimals: asset.decimals,
        image: asset?.tokenLogoUrl,
        coinGeckoId: asset?.coingeckoId,
      }));

    const mergedAssets = [...currentAssets, ...assetsToAdd];

    writeFileSync(fileName, JSON.stringify(mergedAssets, null, 4));

    console.log("Assets added successfully");
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

main();
