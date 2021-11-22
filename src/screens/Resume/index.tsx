import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VictoryPie } from 'victory-native';

import { HistoryCar } from '../../components/HistoryCar';

import { useTheme } from 'styled-components';

import { Container, Header, Title, Content, ChartContainer } from './styles';
import { categories } from '../../utils/categories';
import { RFValue } from 'react-native-responsive-fontsize';

interface TransactionData {
  type: 'positive' | 'negative',
  name: string;
  amount: string;
  category: string;
  date: string;
}

interface CategoryData {
  key: string;
  name: string;
  color: string;
  total: number;
  formattedTotal: string;
  percent: string;
}

export function Resume() {
  const [totalByCategories, setTotalByCategories] = useState<CategoryData>([]);

  const theme = useTheme();

  async function loadData() {
    const dataKey = '@gofinances:transactions';
    const response = await AsyncStorage.getItem(dataKey);
    const formattedResponse = response ? JSON.parse(response) : [];

    const costs = formattedResponse
      .filter((expensive: TransactionData) => expensive.type === 'negative');

    const costsTotal = costs.reduce((acumullator: number, cost: TransactionData) => {
      return acumullator += Number(cost.amount);
    }, 0);

    const totalByCategory: CategoryData[] = [];

    categories.forEach(category => {
      let categorySum = 0;

      costs.forEach((expensive: TransactionData) => {
        if (expensive.category === category.key) {
          categorySum += Number(expensive.amount);
        }
      });

      if (categorySum > 0) {
        const formattedTotal = categorySum.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        const percent = `${(categorySum / costsTotal * 100).toFixed(0)}%`;

        totalByCategory.push({
          key: category.key,
          name: category.name,
          color: category.color,
          total: categorySum,
          formattedTotal,
          percent
        });
      }
    })
    setTotalByCategories(totalByCategory);
  }

  useEffect(() => {
    loadData();
  }, [])

  return (
    <Container>
      <Header>
        <Title>Cadastro</Title>
      </Header>

      <ChartContainer>
        <VictoryPie
          data={totalByCategories}
          colorScale={totalByCategories.map(category => category.color)}
          style={{
            labels: {
              fontSize: RFValue(18),
              fontWeight: 'bold',
              fill: theme.colors.shape
            }
          }}
          x="percent"
          y="total"
        />
      </ChartContainer>

      <Content>
        {totalByCategories.map(item => (
          <HistoryCar
            key={item.key}
            title={item.name}
            amount={item.total}
            color={item.color}
          />
        ))}
      </Content>

    </Container>
  );
};