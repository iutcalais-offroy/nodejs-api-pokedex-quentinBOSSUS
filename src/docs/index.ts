import fs from 'fs'
import path from 'path'
import YAML from 'js-yaml'

interface SwaggerDocument {
  openapi: string
  info: object
  servers?: object[]
  components?: object
  tags?: object[]
  paths: Record<string, unknown>
}

function loadYAML(fileName: string): SwaggerDocument {
  const filePath = path.join(process.cwd(), 'src', 'docs', fileName)
  const content = fs.readFileSync(filePath, 'utf8')
  return YAML.load(content) as SwaggerDocument
}

// Charger la configuration principale
const swaggerConfig = loadYAML('swagger.config.yml')

// Charger les documentations des modules
const authDoc = loadYAML('auth.doc.yml')
const cardsDoc = loadYAML('cards.doc.yml')
const deckDoc = loadYAML('deck.doc.yml')

// Fusionner tous les paths en un seul objet
export const swaggerDocument: SwaggerDocument = {
  ...swaggerConfig,
  paths: {
    ...authDoc.paths,
    ...cardsDoc.paths,
    ...deckDoc.paths,
  },
}
