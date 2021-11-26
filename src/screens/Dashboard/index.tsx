import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import { useTheme } from 'styled-components';

import { useFocusEffect } from '@react-navigation/native';

import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  TransactionList,
  Transactions,
  Title,
  LogoutButton,
  LoadingContainer
} from './styles';
import { useAuth } from '../../hooks/auth';

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HighlightProps {
  amount: string;
  lastTransaction: string;
}

interface HighlightData {
  entries: HighlightProps;
  costs: HighlightProps;
  total: HighlightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DataListProps>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData);

  const { signOut, user } = useAuth();

  const theme = useTheme();

  function getLastTransaction(collection: DataListProps[], type: 'positive' | 'negative') {

    const filteredCollection = collection
      .filter(transaction => transaction.type === type);

    if (filteredCollection.length === 0) {
      return 0;
    }

    const lastTransaction = new Date(
      Math.max.apply(Math, filteredCollection
        .map(transaction => new Date(transaction.date).getTime())));

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long' })}`;
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let costsTotal = 0;

    const formattedTransactions: DataListProps[] = transactions.map((item: DataListProps) => {

      if (item.type === 'positive') {
        entriesTotal += Number(item.amount);
      } else {
        costsTotal += Number(item.amount);
      }

      const amount = Number(item.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date));

      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,
        category: item.category,
        date
      }

    });
    setData(formattedTransactions);

    const lastTransactionEntries = getLastTransaction(transactions, 'positive');
    const lastTransactionCosts = getLastTransaction(transactions, 'negative');

    const totalInterval = lastTransactionEntries === 0
      ? 'Não há transações'
      : `01 a ${lastTransactionCosts}`;

    const total = entriesTotal - costsTotal;

    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionEntries === 0
          ? 'Não há transações'
          : `Última entrada dia ${lastTransactionEntries}`
      },
      costs: {
        amount: costsTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionCosts === 0
          ? 'Não há transações'
          : `Última entrada dia ${lastTransactionCosts}`
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    })

    setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();

      return () => { }
    }, [])
  );

  return (
    <Container>
      {isLoading
        ? (
          <LoadingContainer>
            <ActivityIndicator
              color={theme.colors.primary}
              size="large"
            />
          </LoadingContainer>
        ) : (
          <>
            <Header>
              <UserWrapper>
                <UserInfo>
                  <Photo
                    source={{ uri: user.photo }}
                  />
                  <User>
                    <UserGreeting>Olá, </UserGreeting>
                    <UserName>{user.name}</UserName>
                  </User>
                </UserInfo>

                <LogoutButton onPress={signOut}>
                  <Icon name="power" />
                </LogoutButton>

              </UserWrapper>
            </Header>

            <HighlightCards>
              <HighlightCard
                type="up"
                title="Entrada"
                amount={highlightData.entries.amount}
                lastTransaction={highlightData.entries.lastTransaction}
              />
              <HighlightCard
                type="down"
                title="Saida"
                amount={highlightData.costs.amount}
                lastTransaction="Última saída dia 03 de abril"
              />
              <HighlightCard
                type="total"
                title="Total"
                amount={highlightData.total.amount}
                lastTransaction="01 à 16 de abril"
              />
            </HighlightCards>

            <Transactions>
              <Title>Listagem</Title>

              <TransactionList
                data={data}
                renderItem={({ item }) => <TransactionCard data={item} />}
              />

            </Transactions>
          </>
        )
      }
    </Container >
  );
};