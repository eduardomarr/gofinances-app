import React, { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VictoryPie } from 'victory-native';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { HistoryCar } from '../../components/HistoryCar';

import { useTheme } from 'styled-components';

import {
  Container,
  Header,
  Title,
  Content,
  ChartContainer,
  MonthSelect,
  MonthSelectButton,
  MonthSelectIcon,
  Month,
  LoadingContainer
} from './styles';
import { categories } from '../../utils/categories';
import { RFValue } from 'react-native-responsive-fontsize';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { useAuth } from '../../hooks/auth';

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
  const [isLoading, setIsloading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalByCategories, setTotalByCategories] = useState<CategoryData>([]);

  const theme = useTheme();

  const { user } = useAuth();

  function handleChangeDate(action: 'next' | 'prev') {

    if (action === 'next') {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
    } else {
      const newDate = subMonths(selectedDate, 1);
      setSelectedDate(newDate);
    }
  }

  async function loadData() {
    setIsloading(true);

    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const formattedResponse = response ? JSON.parse(response) : [];

    const costs = formattedResponse
      .filter((cost: TransactionData) =>
        cost.type === 'negative' &&
        new Date(cost.date).getMonth() === selectedDate.getMonth() &&
        new Date(cost.date).getFullYear() === selectedDate.getFullYear()

      );

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
    setIsloading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadData();

      return () => { }
    }, [selectedDate])
  );

  return (
    <Container>
      <Header>
        <Title>Cadastro</Title>
      </Header>

      {
        isLoading ? (
          <LoadingContainer>
            <ActivityIndicator
              color={theme.colors.primary}
              size="large"
            />
          </LoadingContainer>
        ) : (
          <Content
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: useBottomTabBarHeight(),
            }}
          >

            <MonthSelect>
              <MonthSelectButton onPress={() => handleChangeDate('prev')}>
                <MonthSelectIcon name="chevron-left" />
              </MonthSelectButton>

              <Month>{format(selectedDate, 'MMMM, yyyy', { locale: ptBR })}</Month>

              <MonthSelectButton onPress={() => handleChangeDate('next')}>
                <MonthSelectIcon name="chevron-right" />
              </MonthSelectButton>
            </MonthSelect>

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
                labelRadius={100}
                x="percent"
                y="total"
              />
            </ChartContainer>

            {totalByCategories.map(item => (
              <HistoryCar
                key={item.key}
                title={item.name}
                amount={item.total}
                color={item.color}
              />
            ))}
          </Content>
        )
      }
    </Container>
  );
};