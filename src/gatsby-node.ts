import { createMdxFileNode } from "./createMdxNode.js";
import { createRemoteFileNode } from "gatsby-source-filesystem";
import type { GatsbyNode } from "gatsby";

// Node API reference: https://www.gatsbyjs.com/docs/node-apis/

const pluginName = "gatsby-mdx-remote";

export interface PluginTypeOptions {
  mdxField: string;
  mdxFrontmatterField: string;
  preprocessImages?: boolean;
  gatsbyImageClassName?: string;
}

export interface PluginOptions {
  mdxNodeTypes: {
    [key: string]: PluginTypeOptions;
  };
}

interface MdxNodeShape {
  image: Array<string>;
  frontmatter: Record<string, any>;
}

export const onPreInit: GatsbyNode["onPreInit"] = () => console.log(`Loaded ${pluginName}`);

export const createResolvers: GatsbyNode["createResolvers"] = async (
  { actions, cache, createNodeId, createResolvers, store, reporter },
  options
) => {
  const { createNode } = actions;

  const frontmatterSharpRemoteImageUrlArrayField =
    typeof options.frontmatterSharpRemoteImageUrlArrayField === "string"
      ? options.frontmatterSharpRemoteImageUrlArrayField
      : undefined;
  const imageListResolver = {
    Mdx: {
      ...((frontmatterSharpRemoteImageUrlArrayField && {
        [frontmatterSharpRemoteImageUrlArrayField]: {
          type: `[File]`,
          resolve: async (source: MdxNodeShape, _args: unknown, _context: unknown, _info: unknown) => {
            return Array.isArray(source.frontmatter[frontmatterSharpRemoteImageUrlArrayField])
              ? source.frontmatter[frontmatterSharpRemoteImageUrlArrayField].map((url: any) =>
                  createRemoteFileNode({
                    url,
                    createNode,
                    createNodeId,
                    cache,
                  })
                )
              : [];
          },
        },
      }) ||
        {}),

      markdownImageList: {
        type: `[File]`,
        resolve: async (source: MdxNodeShape, _args: unknown, _context: unknown, _info: unknown) => {
          return Array.isArray(source.frontmatter["markdownImageList"])
            ? source.frontmatter["markdownImageList"].map((url: any) =>
                createRemoteFileNode({
                  url,
                  createNode,
                  createNodeId,
                  cache,
                })
              )
            : [];
        },
      },
    },
  };

  const mdxTypeResolvers = {
    Query: {
      ...((options.mdxNodeTypes &&
        typeof options.mdxNodeTypes === "object" &&
        !Array.isArray(options.mdxNodeTypes) &&
        Object.keys(options.mdxNodeTypes).reduce(
          (typeNames, typeName) => ({
            ...typeNames,
            [`mdx${typeName}`]: {
              type: [typeName],
              resolve: async (source: any, args: any, context: any, info: any) => {
                const { entries } = await context.nodeModel.findAll({ type: typeName });
                return entries;
              },
            },
          }),
          {}
        )) ||
        {}),
    },
  };

  createResolvers({
    ...imageListResolver,
    ...mdxTypeResolvers,
  });
};

export const onCreateNode: GatsbyNode["onCreateNode"] = async (sourceArgs, options) => {
  // FIXME: Inprovement opportunity: Guard the imput
  const pluginOptions: PluginOptions = options as any;

  const {
    node,
    actions,
    getNode,
    
  } = sourceArgs;
  const {createParentChildLink} = actions;

  if (node.internal.type === "Mdx") {
    const parentFileNode = node.parent && getNode(node.parent);
    const grandParentContentNode = parentFileNode && parentFileNode?.parent && getNode(parentFileNode.parent);
    grandParentContentNode && createParentChildLink({ parent: grandParentContentNode, child: node });
  }

  if (!options["mdxNodeTypes"]) {
    throw new Error("This plugin requires mdxNodeTypes to be defined");
  }

  const configuredMdxNodeTypes: Array<string> = (pluginOptions.mdxNodeTypes && Object.keys(pluginOptions.mdxNodeTypes)) || [];
  const isConfiguredType = configuredMdxNodeTypes && configuredMdxNodeTypes.indexOf(node.internal.type) !== -1;
  if (isConfiguredType) {
    await createMdxFileNode(node, pluginOptions.mdxNodeTypes[node.internal.type], sourceArgs);
  }
};
