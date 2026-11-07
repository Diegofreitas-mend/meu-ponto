import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { estilos } from './estilos';

const avaliacaoMockada = {
    localizacao: "Praça do Ferreira - Centro",
    nota: 4,
    tags: "Acessível, Seguro, Limpo",
    descricao: "Lugar muito bom, mas faltam lixeiras ao redor."
};

export default function AvaliacaoScreen() {
    const [localizacao, setLocalizacao] = useState(avaliacaoMockada.localizacao);
    const [nota, setNota] = useState(avaliacaoMockada.nota);
    const [tags, setTags] = useState(avaliacaoMockada.tags);
    const [descricao, setDescricao] = useState(avaliacaoMockada.descricao);

    const renderizarEstrelas = () => {
        let estrelas = [];
        for (let i = 1; i <= 5; i++) {
            estrelas.push(
                <TouchableOpacity key={i} onPress={() => setNota(i)}>
                    <FontAwesome
                        name={i <= nota ? 'star' : 'star-o'}
                        size={36}
                        color="#FFD700"
                        style={estilos.estrela}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={estilos.containerEstrelas}>{estrelas}</View>;
    };

    return (
        <View style={estilos.areaSegura}>
            <ScrollView contentContainerStyle={estilos.containerGeral}>

                <Text style={estilos.tituloCabecalho}>Adicionar avaliação</Text>
                <View style={estilos.divisor} />

                <TextInput
                    style={estilos.campoDeTexto}
                    placeholder="Localização do ponto"
                    value={localizacao}
                    onChangeText={setLocalizacao}
                />
                <View style={estilos.containerBotaoMapa}>
                    <TouchableOpacity style={estilos.botaoMapa}>
                        <Text style={estilos.textoBotaoMapa}>Localizar no mapa</Text>
                    </TouchableOpacity>
                </View>

                {renderizarEstrelas()}

                <TextInput
                    style={estilos.campoDeTexto}
                    placeholder="Tags"
                    value={tags}
                    onChangeText={setTags}
                />

                <TextInput
                    style={[estilos.campoDeTexto, estilos.areaDeTexto]}
                    placeholder="Descrição da avaliação"
                    value={descricao}
                    onChangeText={setDescricao}
                    multiline={true}
                    numberOfLines={6}
                    textAlignVertical="top"
                />

                <TouchableOpacity style={estilos.botaoEnviar}>
                    <Text style={estilos.textoBotaoEnviar}>Enviar avaliação</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}