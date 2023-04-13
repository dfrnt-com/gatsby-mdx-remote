import { createFileNodeFromBuffer } from "gatsby-source-filesystem";
import YAML from "YAML";
import type { Node, CreateNodeArgs } from "gatsby";
import { PluginTypeOptions } from "./gatsby-node.js";
import { extractUrlAndReplaceWithGatsbyImage } from "./extractUrlAndReplaceWithGatsbyImage.js";

const recurseFieldContent = (
  nodeData: IntermediateNodeData,
  objectFieldSequence: Array<string>
): NodeDataObject | string | undefined => {
  if (objectFieldSequence.length === 0 || !nodeData) {
    return nodeData;
  } else {
    const fieldName = objectFieldSequence[0];
    if (Array.isArray(nodeData)) {
      return recurseFieldContent(nodeData[0], objectFieldSequence);
    } else if (!Array.isArray(nodeData) && typeof nodeData === "object") {
      const fields = objectFieldSequence.slice(1);
      const childNodeData = nodeData[fieldName];
      return recurseFieldContent(childNodeData, fields);
    } else {
      return undefined;
    }
  }
};

interface CachedMdxImagesProps {
  pushImageUrlList: (value: string) => void;
  className?: string;
}
interface NodeDataObject {
  [key: string]: string | NodeDataObject;
}

type IntermediateNodeData = NodeDataObject | string;

const cacheMdxImages = async ({ pushImageUrlList, className }: CachedMdxImagesProps, content: string): Promise<string> => {
  const remark = (await import("remark")).remark;

  const urlList: Array<string> = [];
  const pushImageUrlToList = (value: string) => urlList.push(value);
  const getUrlListLength = () => urlList.length;

  const file = await remark().use(extractUrlAndReplaceWithGatsbyImage, { pushImageUrlToList, getUrlListLength, className }).process(content);

  const mdx = "\n\n\n" + String(file);
  urlList.forEach((url) => pushImageUrlList(url));
  return mdx;
};

export const createMdxFileNode = async (
  nodeData: Node & Record<string, any>,
  typeConfig: PluginTypeOptions,
  args: CreateNodeArgs<Record<string, unknown>>
) => {
  const { actions, createNodeId, getCache } = args;
  const { createNode } = actions;
  
  const urlList: Array<string> = [];
  
  const isPreprocessImagesEnabled = typeConfig.preprocessImages === undefined || typeConfig.preprocessImages;
  const mdxProcessedFieldData = await getMdx(typeConfig, nodeData, isPreprocessImagesEnabled, (value) => urlList.push(value));
  const frontmatter = getMdxFrontmatter(typeConfig, nodeData, urlList);

  const gatsbyImageImport =
    isPreprocessImagesEnabled &&
    mdxProcessedFieldData &&
    mdxProcessedFieldData.indexOf("import { GatsbyImage, getImage") === -1 &&
    mdxProcessedFieldData.indexOf("import { getImage, GatsbyImage") === -1
      ? 'import { GatsbyImage, getImage } from "gatsby-plugin-image"'
      : "";

  const mdxContentWithFrontmatter = `${
    (typeConfig.mdxFrontmatterField && frontmatter) || undefined
  }\n\n${gatsbyImageImport}\n\n${mdxProcessedFieldData}`;

  if (mdxContentWithFrontmatter) {
    return createFileNodeFromBuffer({
      buffer: Buffer.from(mdxContentWithFrontmatter),
      ext: ".mdx",
      parentNodeId: nodeData.id,
      getCache: getCache,
      createNode: createNode,
      createNodeId: createNodeId,
    });
  }
};

async function getMdx(
  typeConfig: PluginTypeOptions,
  nodeData: Node & Record<string, any>,
  isPreprocessImagesEnabled: boolean,
  pushImageUrlList: (value: string) => void
) {
  const mdxField = typeConfig.mdxField;
  const className = typeConfig.gatsbyImageClassName ?? "";
  const mdxFields = mdxField ? mdxField.split(".") : undefined;
  const mdxFieldData = mdxFields && `\n${recurseFieldContent(nodeData, mdxFields) ?? ""}`;

  const mdxProcessedFieldData =
    isPreprocessImagesEnabled && mdxFieldData ? await cacheMdxImages({ pushImageUrlList, className }, mdxFieldData) : mdxFieldData;
  return mdxProcessedFieldData;
}

function getMdxFrontmatter(typeConfig: PluginTypeOptions, nodeData: Node & Record<string, any>, urlList: string[]) {
  const frontmatterField = typeConfig.mdxFrontmatterField;
  const frontmatterFields = (frontmatterField && (frontmatterField.indexOf(".") !== -1 ? frontmatterField.split(".") : [frontmatterField])) || undefined;
  const recursedFrontmatterFieldData = frontmatterFields && recurseFieldContent(nodeData, frontmatterFields);
  const frontmatterFieldData = (recursedFrontmatterFieldData && typeof recursedFrontmatterFieldData !== "string" && recursedFrontmatterFieldData) || undefined;
  const frontmatter = frontmatterFieldData && `---\n${YAML.stringify({ ...frontmatterFieldData, markdownImageList: urlList })}---\n`;
  return frontmatter;
}
