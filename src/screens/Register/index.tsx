import React, { useState, useEffect } from 'react';
import { Alert, Keyboard, Modal, TouchableWithoutFeedback } from 'react-native';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import uuid from 'react-native-uuid';

import { InputForm } from '../../components/Form/InputForm';
import { Button } from '../../components/Form/Button';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Container, Header, Title, Form, Fields, TransactionsType } from './styles';

import { CategorySelect } from '../CategorySelect';
import { useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';

interface FormData {
  name: string;
  amount: string;
}

const schema = Yup.object().shape({
  name: Yup
    .string()
    .required('Nome é obrigatório'),
  amount: Yup
    .number()
    .typeError('Informe um valor numérico')
    .positive('O valor não pode ser negativo')
    .required('O valor é obrigatório'),
})

export function Register() {
  const [transactionType, setTransactionType] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const navigation = useNavigation();

  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria'
  });

  function handleTransactionsTypeSelect(type: 'positive' | 'negative') {
    setTransactionType(type)
  };

  function handleOpenSelectCategoryModal() {
    setCategoryModalOpen(true);
  };

  function handleCloseSelectCategoryModal() {
    setCategoryModalOpen(false);
  };

  async function handleRegister(form: FormData) {
    if (!transactionType) {
      return Alert.alert('Selecione o tipo da transação')
    }

    if (category.key === 'category') {
      return Alert.alert('Selecione a categoria')
    }


    const newTransaction = {
      id: String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactionType,
      category: category.key,
      date: new Date()
    };

    try {
      const dataKey = '@gofinances:transactions';

      const data = await AsyncStorage.getItem(dataKey);
      const currentData = data ? JSON.parse(data) : [];

      const formattedData = [
        ...currentData,
        newTransaction
      ];

      await AsyncStorage.setItem(dataKey, JSON.stringify(formattedData));

      reset();
      setTransactionType('');
      setCategory({
        key: 'category',
        name: 'Categoria'
      })

      navigation.navigate('Listagem');

    } catch (error) {
      console.log(error);
      Alert.alert("Não foi possivel salvar")
    }
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {

    async function getData() {
      const dataKey = '@gofinances:transactions';
      const data = await AsyncStorage.getItem(dataKey);
      console.log(data);
    }

    getData();

  }, [])

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>

        <Form>
          <Fields>
            <InputForm
              control={control}
              name="name"
              placeholder="Nome"
              autoCapitalize="sentences"
              autoCorrect={false}
              error={errors.name && errors.name.message}
            />

            <InputForm
              control={control}
              name="amount"
              placeholder="Preço"
              keyboardType="numeric"
              error={errors.amount && errors.amount.message}
            />

            <TransactionsType>
              <TransactionTypeButton
                title="Income"
                type="up"
                onPress={() => handleTransactionsTypeSelect('positive')}
                isActive={transactionType === 'positive'}
              />

              <TransactionTypeButton
                title="Outcome"
                type="down"
                onPress={() => handleTransactionsTypeSelect('negative')}
                isActive={transactionType === 'negative'}
              />
            </TransactionsType>

            <CategorySelectButton
              title={category.name}
              onPress={handleOpenSelectCategoryModal}
            />

          </Fields>

          <Button
            title="Enviar"
            onPress={handleSubmit(handleRegister)}
          />
        </Form>

        <Modal
          visible={categoryModalOpen}
        >
          <CategorySelect
            category={category}
            setCategory={setCategory}
            closeSelectCategory={handleCloseSelectCategoryModal}
          />

        </Modal>

      </Container>
    </TouchableWithoutFeedback>
  );
};

