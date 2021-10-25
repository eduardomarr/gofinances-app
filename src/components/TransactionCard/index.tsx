import React from 'react';

import { Container, Title, Amount, Footer, Category, Icon, CategoryName, Date } from './styles';

interface TransactionCardProps {
}

export function TransactionCard() {
  return (
    <Container>
      <Title>Desenvolvimento do site</Title>

      <Amount>R$ 12.000,00</Amount>

      <Footer>
        <Category>
          <Icon name="dollar-sign" />
          <CategoryName>Vendas</CategoryName>
        </Category>
        <Date>13/04/2020</Date>
      </Footer>
    </Container>
  );
};
