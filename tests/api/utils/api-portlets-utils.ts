import { expect, APIRequestContext } from "@playwright/test";
import { config } from "../../general-config";

export interface PortletDefBasicInfo {
  id: string;
  name: string;
  fname: string;
}

interface PortletsResponse {
  portlets: PortletDefBasicInfo[];
}

/*
 * Retrieve the details for a portlet identified by it's fname.
 */
export async function getPortletDetails(
  request: APIRequestContext,
  portletFname: string
): Promise<PortletDefBasicInfo | null> {
  const response = await request.get(`${config.url}api/portlets.json`);
  expect(response.status()).toEqual(200);
  const portletsJson: PortletsResponse = await response.json() as PortletsResponse;
  const portlets: PortletDefBasicInfo[] = portletsJson.portlets;
  for (const val of portlets) {
    if (val != null && val.fname == portletFname) {
      return val;
    }
  }
  return null;
}

