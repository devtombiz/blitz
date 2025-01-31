import {log} from "@blitzjs/display"
import {Command, flags} from "@oclif/command"
import {getPackageJson} from "../utils/get-package-json"
import {runPrisma} from "./prisma"

export class CodeGen extends Command {
  static description = "Generates Routes Manifest"
  static aliases = ["cg"]

  static flags = {
    help: flags.help({char: "h"}),
  }

  async run() {
    this.parse(CodeGen)

    try {
      let routeSpinner = log.spinner(`Generating route manifest`).start()
      const {loadConfigProduction} = await import("next/dist/server/config-shared")
      const {saveRouteManifest} = await import("next/dist/build/routes")
      const config = loadConfigProduction(process.cwd())
      void saveRouteManifest(process.cwd(), config).then(() => routeSpinner.succeed())

      const {dependencies, devDependencies, prisma} = await getPackageJson()

      const hasPrisma = Object.keys({...dependencies, ...devDependencies}).some(
        (name) => name === "prisma",
      )
      const hasPrismaSchema = !!prisma?.schema

      if (hasPrisma && hasPrismaSchema) {
        let prismaSpinner = log.spinner(`Generating Prisma client`).start()
        void runPrisma(["generate"], true).then((success) =>
          success ? prismaSpinner.succeed() : prismaSpinner.fail(),
        )
      }
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  }
}
