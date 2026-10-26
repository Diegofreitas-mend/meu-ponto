import { StyleSheet } from 'react-native';

export const estilos = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerGeral: {
    padding: 20,
    paddingTop: 40,
  },
  tituloCabecalho: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  divisor: {
    height: 1,
    backgroundColor: '#ccc',
    marginBottom: 20,
    marginHorizontal: -20,
  },
  campoDeTexto: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  containerBotaoMapa: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  botaoMapa: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textoBotaoMapa: {
    fontSize: 12,
    color: '#333',
  },
  containerEstrelas: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  estrela: {
    marginHorizontal: 5,
  },
  areaDeTexto: {
    height: 150,
    marginBottom: 20,
  },
  botaoEnviar: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotaoEnviar: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});