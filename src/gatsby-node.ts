import { createMdxNode } from "./createMdxNode.js";
import { createRemoteFileNode } from "gatsby-source-filesystem";
import type { GatsbyNode } from "gatsby";

// Node API reference: https://www.gatsbyjs.com/docs/node-apis/

const pluginName = "gatsby-transform-remote-mdx";

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
  frontmatter: {
    imageList: Array<string>;
  };
}

export const onPreInit: GatsbyNode["onPreInit"] = () => console.log(`Loaded ${pluginName}`);

export const createResolvers: GatsbyNode["createResolvers"] = async (
  { actions, cache, createNodeId, createResolvers, store, reporter },
  options
) => {
  const { createNode } = actions;
  const resolvers = {
    Mdx: {
      images: {
        type: `[File]`,
        resolve: async (source: MdxNodeShape, _args: unknown, _context: unknown, _info: unknown) => {
          return source.frontmatter.imageList
            ? source.frontmatter.imageList.map((url) =>
                createRemoteFileNode({
                  url: url,
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
  createResolvers(resolvers);
};

export const onCreateNode: GatsbyNode["onCreateNode"] = async (sourceArgs, options) => {
  if (!options["mdxNodeTypes"]) {
    throw new Error("This plugin requires mdxNodeTypes to be defined");
  }

  // FIXME: Inprovement opportunity: Guard the imput
  const pluginOptions: PluginOptions = options as any;

  const { node } = sourceArgs;

  const configuredMdxNodeTypes: Array<string> = (pluginOptions.mdxNodeTypes && Object.keys(pluginOptions.mdxNodeTypes)) || [];
  if (configuredMdxNodeTypes && configuredMdxNodeTypes.indexOf(node.internal.type) !== -1) {
    createMdxNode(node, pluginOptions.mdxNodeTypes[node.internal.type], sourceArgs);
  }
};
